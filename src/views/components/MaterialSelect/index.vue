<template>
  <div>
    <div class="flex items-center">
      <Select
        allowClear
        placeholder="物料类型"
        v-model:value="filterData.dictItemMaterialTypeId"
        style="width: 130px; margin-right: 6px"
      >
        <Select.Option v-for="{ id, itemValue } in dataStore.dictItemMaterialTypeList" :key="id" :value="id">
          {{ itemValue }}
        </Select.Option>
      </Select>

      <Input.Search
        :style="{ width: '240px' }"
        v-model:value="filterData.keyword"
        placeholder="请输入物料名称过滤"
        enter-button="搜索"
        @search="handleSearch"
      />

      <span class="text-primary hover-opacity ml-8px" @click="handleReset">重置</span>
    </div>

    <Divider />

    <div>
      <Tree
        v-if="treeData.length"
        v-model:selectedKeys="selectedKeys"
        v-model:checkedKeys="checkedKeys"
        v-model:expandedKeys="expandedKeys"
        checkable
        :tree-data="treeData"
        @select="handleTreeSelect"
      >
        <template #title="{ title, key }">
          <span v-if="key === '0-0-1-0'" style="color: #1890ff">{{ title }}</span>
          <template v-else>{{ title }}</template>
        </template>
      </Tree>
      <p v-else class="text-gray-400 py-15px">暂无物料，请先创建</p>
    </div>

    <div class="flex justify-center">
      <Button type="primary" @click="handleAdd">添加物料+</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Input, Select, Button, Divider, Tree, message } from "ant-design-vue";
  import { withDefaults, defineProps, defineEmits, computed, onMounted, reactive, ref, watch, unref } from "vue";
  import { useDataStore } from "/@/store";
  import { MaterialDetail } from "/@/api/model/material";
  import { cloneDeep } from "lodash";

  interface Props {
    disabledMaterialSpecsIds: number[];
  }

  const props = withDefaults(defineProps<Props>(), {
    disabledMaterialSpecsIds: () => [],
  });

  const emits = defineEmits(["submit:ok"]);

  const dataStore = useDataStore();

  const materialRawList = computed(() => dataStore.materialListAll);
  const materialFilterList = ref<MaterialDetail[]>([]);

  const selectedKeys = ref<string[]>([]);
  const checkedKeys = ref<string[]>([]);
  const expandedKeys = ref<number[]>([]);

  const treeData = computed(() => {
    const fl = materialFilterList.value;
    const { disabledMaterialSpecsIds } = props;
    const treeList: any[] = [];

    for (let i = 0; i < fl.length; i++) {
      const mi = fl[i];
      const { materialSpecsList, materialName } = mi;
      const key = mi.id;

      const materialData = {
        key,
        title: materialName,
        children: [] as any[],
        // 一级均为种类 不允许勾选
        checkable: false,
      };

      for (let j = 0; j < materialSpecsList.length; j++) {
        const si = materialSpecsList[j];
        const { specsName } = si;
        const key = `${mi.id}-${si.id}`;

        const disabled = !!disabledMaterialSpecsIds.find((specsId) => specsId === si.id);

        const specsData = {
          key,
          title: specsName,
          disabled,
          checkable: !disabled,
        };

        materialData.children.push(specsData);
      }

      treeList.push(materialData);
    }

    console.log(treeList);
    return treeList;
  });

  /** 过滤数据 */
  const filterData = reactive<any>({
    keyword: "",
    dictItemMaterialTypeId: undefined,
  });

  watch([() => filterData.keyword, () => filterData.dictItemMaterialTypeId], () => {
    toUpdateMaterialFilterList();
  });

  onMounted(async () => {
    await initMaterialList();
  });

  /** 树节点点击 */
  function handleTreeSelect(_selectedKeys: string[], e: any) {
    const {
      node: { key: selectKey },
    } = e;

    console.log(selectKey);
    if (typeof selectKey === "string") {
      const ckList = checkedKeys.value;
      const findKeyIndex = ckList.findIndex((key) => key === selectKey);
      if (findKeyIndex > -1) {
        checkedKeys.value = ckList.filter((key) => key !== selectKey);
      } else {
        checkedKeys.value = [...ckList, selectKey];
      }
    } else if (typeof selectKey === "number") {
      const ekList = expandedKeys.value;
      const findKeyIndex = ekList.findIndex((key) => key === selectKey);
      if (findKeyIndex > -1) {
        expandedKeys.value = ekList.filter((key) => key !== selectKey);
      } else {
        expandedKeys.value = [...ekList, selectKey];
      }
    }
  }

  /** 获取完整物料选择列表 */
  function getWholeCheckedMaterialList() {
    const cks = unref(checkedKeys);
    const mrList = unref(materialRawList);

    const list: any[] = [];
    for (let i = 0; i < cks.length; i++) {
      const [mk, spk] = cks[i].split("-").map((i) => Number(i));
      const materialInfo = mrList.find((i) => i.id === mk)!!;
      const { materialSpecsList } = materialInfo;
      const data: any = {};

      for (let j = 0; j < materialSpecsList.length; j++) {
        const materialSpecsInfo = materialSpecsList.find((i) => i.id === spk);
        data.materialInfo = materialInfo;
        data.materialSpecsInfo = materialSpecsInfo;
        break;
      }
      list.push(data);
    }
    return list;
  }

  /** 添加物料 */
  function handleAdd() {
    const list = getWholeCheckedMaterialList();
    console.log(list);
    if (list.length) {
      emits("submit:ok", unref(checkedKeys), list);
    } else {
      message.warn("请选择物料");
    }
  }

  /** 重置 */
  function handleReset() {
    filterData.keyword = "";
    filterData.dictItemMaterialTypeId = undefined;
  }

  /** 搜索 */
  function handleSearch() {
    toUpdateMaterialFilterList();
  }

  /** 基于过滤条件-更新物料列表 */
  async function toUpdateMaterialFilterList() {
    const { dictItemMaterialTypeId, keyword } = filterData;

    let fl = materialRawList.value;

    if (dictItemMaterialTypeId) {
      fl = fl.filter((i) => i.dictItemMaterialTypeId === dictItemMaterialTypeId);
    }

    if (keyword) {
      // 根据规格过滤
      const sfList = dataStore.materialSpecsList.filter((i) => i.specsName.includes(keyword));

      // 根据物料名称过滤，带上规格物料
      const mfList = cloneDeep(
        dataStore.materialListAll.filter(
          (i) => i.materialName.includes(keyword) || sfList.find((j) => j.materialId === i.id)
        )
      );

      for (let i = 0; i < mfList.length; i++) {
        const mi = mfList[i];
        // 如果是一级项 搜索过滤出二级项
        if (sfList.find((j) => j.materialId === mi.id)) {
          mi.materialSpecsList = sfList.filter((i) => i.materialId === mi.id);
        }
      }

      console.log(sfList, mfList);

      fl = mfList;
    }

    materialFilterList.value = fl;

    // 更新展开项
    updateExpandList();
  }

  /** 更新展开项 */
  function updateExpandList() {
    const mfList = materialFilterList.value;
    const eKeys = mfList.map((i) => i.id);
    expandedKeys.value = eKeys;
  }

  /** 初始化物料列表 */
  async function initMaterialList() {
    toUpdateMaterialFilterList();
  }
</script>

<style></style>
