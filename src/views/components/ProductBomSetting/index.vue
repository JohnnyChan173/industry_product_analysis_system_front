<template>
  <div>
    <div class="flex items-center">
      <Select
        allowClear
        placeholder="物料类型"
        v-model:value="filterData.dictItemMaterialTypeId"
        style="width: 150px; margin-right: 6px"
      >
        <Select.Option v-for="{ id, itemValue } in dataStore.dictItemMaterialTypeList" :key="id" :value="id">
          {{ itemValue }}
        </Select.Option>
      </Select>

      <Input.Search
        :style="{ width: '300px' }"
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
        defaultExpandAll
        checkable
        :tree-data="treeData"
      >
        <template #title="{ title, key }">
          <span v-if="key === '0-0-1-0'" style="color: #1890ff">{{ title }}</span>
          <template v-else>{{ title }}</template>
        </template>
      </Tree>
    </div>

    <div class="flex justify-center">
      <Button type="primary" @click="handleAdd">添加物料+</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Input, Select, Button, Divider, Tree } from "ant-design-vue";
  import { defineEmits, computed, onMounted, reactive, ref, watch } from "vue";
  import { useDataStore } from "/@/store";
  import { materialListAll } from "/@/api/material";
  import { MaterialDetail } from "/@/api/model/material";

  const emits = defineEmits(["submit:ok"]);

  const dataStore = useDataStore();

  const materialRawList = ref<MaterialDetail[]>([]);
  const materialFilterList = ref<MaterialDetail[]>([]);

  const selectedKeys = ref<string[]>([]);
  const checkedKeys = ref<string[]>([]);

  const treeData = computed(() => {
    const fl = materialFilterList.value;
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

        const specsData = {
          key,
          title: specsName,
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

  /** 添加物料 */
  function handleAdd() {
    console.log(checkedKeys);
    emits("submit:ok", checkedKeys);
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
      fl = fl.filter((i) => i.materialName.includes(keyword));
    }

    materialFilterList.value = fl;
  }

  /** 初始化物料列表 */
  async function initMaterialList() {
    const mList = await materialListAll(filterData);
    materialRawList.value = mList;
    materialFilterList.value = mList;
  }
</script>

<style></style>
