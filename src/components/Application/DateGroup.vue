<template>
  <div class="flex items-center">
    <a-date-picker
      class="!w-130px"
      :allowClear="false"
      v-model:value="currentDate"
      :picker="currentPicker"
      @change="onCurrentDateChange"
      :size="size"
    />
    <p class="flex items-center" v-if="showSelect">
      <Radio.Group v-model:value="dateType" button-style="solid" @change="onDateTypeChange" :size="size">
        <Radio.Button :value="item.value" v-for="item in DateTypeList" :key="item.value">{{ item.label }}</Radio.Button>
      </Radio.Group>
      <ReloadOutlined v-if="showReload" class="text-20px ml-8px hover-opacity !text-gray-400" @click="handleReload" />
    </p>
  </div>
</template>

<script setup lang="ts">
  import { watch, defineEmits, withDefaults, defineProps, ref } from "vue";
  import { Radio } from "ant-design-vue";
  import { DateType } from "/@/enums/model/index";
  import { DateTypeList } from "/@/config/data";
  import dayjs, { Dayjs } from "dayjs";
  import { formatDateByDayjs } from "/@/utils/util";
  import { RadioGroupSize } from "ant-design-vue/lib/radio/Group";
  import { RedoOutlined, ReloadOutlined } from "@ant-design/icons-vue";
  import { cloneDeep } from "lodash";

  const emits = defineEmits(["update:dateValue", "reload"]);

  interface Props {
    size: RadioGroupSize;
    defaultDateType?: DateType;
    showSelect?: boolean;
    showReload?: boolean;
    dateValue: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    size: "default",
    defaultDateType: DateType.MONTH,
    showSelect: false,
    showReload: false,
  });

  const dateType = ref<DateType>(props.defaultDateType);
  const currentPicker = ref("");
  const currentDate = ref<Dayjs>();

  // 监听时间变化
  watch(
    () => props.dateValue,
    (date) => {
      console.log(date, dateType.value);
      // 2023-04-12
      if (dateType.value === DateType.HOUR) {
        // 组合完整日期
        const d = date + " 00:00:00";
        const dayjsDate = dayjs(d);
        currentDate.value = dayjsDate;
      }
    }
  );

  // 监听传值（时间）变化
  watch(
    () => dateType.value,
    (v) => {
      // 更新当前时间类型
      if (v === DateType.YEAR) {
        currentPicker.value = "";
      } else if (v === DateType.MONTH) {
        currentPicker.value = "year";
      } else if (v === DateType.DAY) {
        currentPicker.value = "month";
      } else if (v === DateType.HOUR) {
        currentPicker.value = "date";
      }

      resetCurrentDate();
    },
    { immediate: true }
  );

  /** 重置当前时间 */
  function resetCurrentDate() {
    const currentTimestamp = Date.now();
    const dayjsDate = dayjs(currentTimestamp);
    currentDate.value = dayjsDate;
    // 触发一次时间更新
    onCurrentDateChange(dayjsDate);
  }

  /** 变化 - 日期类型变更 */
  function onDateTypeChange(e: Event) {
    //   const target = e.target as any;
    //   const value = target.value;
    //   console.log("月日时:", value);
    //   emits("update:dateType", cloneDeep(value));
  }

  /** 变化 - 日期选择值变更 */
  function onCurrentDateChange(dayjsDate: Dayjs) {
    const type = dateType.value;
    let date = "";

    console.log("onCurrentDateChange: ", type, dayjsDate);

    // 根据当前日期类型返回传值
    if (type === DateType.YEAR) {
      date = "";
    } else if (type === DateType.MONTH) {
      date = formatDateByDayjs(dayjsDate, "YYYY");
    } else if (type === DateType.DAY) {
      date = formatDateByDayjs(dayjsDate, "YYYY-MM");
    } else if (type === DateType.HOUR) {
      date = formatDateByDayjs(dayjsDate, "YYYY-MM-DD");
    }

    emits("update:dateValue", cloneDeep(date));
  }

  /** 重新加载 */
  function handleReload() {
    emits("reload");
  }
</script>

<style></style>
