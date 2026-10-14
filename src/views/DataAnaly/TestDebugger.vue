<template>
  <div>
    <Popover placement="top" trigger="click">
      <template #content>
        <div>
          <SubTitle2 class="!mt-0px" title="">
            <span class="mr-4px">信号量模拟发送</span>
            <Tag color="#f50">调试用</Tag>
          </SubTitle2>

          <div class="!w-200px">
            <Input placeholder="请输入moduleUuid" v-model:value="signalTestUuid" />

            <DatePicker
              class="!w-full"
              :format="establishDateFormat"
              v-model:value="signalTestDate"
              placeholder="请选择信号量发送日期"
            />

            <TimePicker class="!w-full" v-model:value="signalTestTime" placeholder="请选择信号量发送时间" />
            <div class="flex whitespace-nowrap items-center">
              <p>通用信号:</p><Input placeholder="选填0-1" v-model:value="signalData[0].payload" />
            </div>
            <div class="flex whitespace-nowrap items-center">
              <p>手环信号:</p><Input placeholder="选填0-1" v-model:value="signalData[1].payload" />
            </div>
            <div class="flex whitespace-nowrap items-center">
              <p>安灯信号:</p><Input placeholder="选填1-5" v-model:value="signalData[2].payload" />
            </div>
            <div class="flex whitespace-nowrap items-center">
              <p>接地信号:</p><Input placeholder="选填0-1" v-model:value="signalData[3].payload" />
            </div>
            <div class="flex whitespace-nowrap items-center">
              <p>scale信号:</p><Input placeholder="选填浮点" v-model:value="signalData[4].payload" />
            </div>

            <p class="text-right">
              <Button type="primary" ghost @click="mockSignalPost">发送</Button>
            </p>


          </div>
        </div>
        <div>
          <SubTitle2 class="!mt-0px" title="">
            <span class="mr-4px">视频模拟发送</span>
            <Tag color="#f50">调试用</Tag>
          </SubTitle2>
          <div class="!w-200px">
            <Input placeholder="请输入messageId" v-model:value="videoTestData.messageId" />
          </div>
          <div class="!w-200px">
            <Input placeholder="请输入视频地址" v-model:value="videoTestData.videoTestUrl" />
          </div>
          <div class="!w-200px">
            <DatePicker  v-model:value="videoTestData.startDate" placeholder="请选择开始时间" show-time />
          </div>
          <div class="!w-200px">
            <DatePicker  v-model:value="videoTestData.endDate" placeholder="请选择结束时间" show-time />
          </div>
          <p class="text-right">
            <Button type="primary" ghost @click="mockVideoPost">发送</Button>
          </p>

          <p class="text-right">
            <Button type="primary" ghost @click="mockVideoPost2">发送2</Button>
          </p>
        </div>

      </template>

      <div @click="handleTestModeClick" style="color: red;opacity: 100;font-size: 20px;">
        测试
      </div>
    </Popover>
  </div>
</template>

<script setup lang="ts">
  import SubTitle2 from "/@/components/Title/SubTitle2.vue";
  import { Button, DatePicker, Input, Popover, Tag, TimePicker, message } from "ant-design-vue";
  import { reactive, ref } from "vue";
  import { gatewayReceiveSignal, gatewayReceiveVideo, getVideoStorageAddress } from "/@/api/gateway";
  import dayjs from "dayjs";

  const establishDateFormat = "YYYY-MM-DD";

  // 测试模式
  const isTestMode = ref(true);

  const signalTestUuid = ref("");
  const signalTestDate = ref(dayjs());
  const signalTestTime = ref(dayjs());
  const signalData = reactive([
    {
      "name": "general_input",
      "payload": "",
    },
    {
      "name": "wristband",
      "payload": "",
    },
    {
      "name": "addon",
      "payload": "",
    },
    {
      "name": "device_ground",
      "payload": "",
    },
    {
      "name": "scale",
      "payload": "",
    },
  ]);
  const videoTestData= reactive({
    messageId: "",
    videoTestUrl: "",
    startDate: "",
    endDate: "",
  })

  /** 模拟信号量发送 */
  async function mockSignalPost() {
    const moduleUuid = signalTestUuid.value;
    const dateRef = signalTestDate.value as any;
    const timeRef = signalTestTime.value as any;

    if (!moduleUuid || !dateRef || !timeRef) {
      message.warn("请填写完整参数");
      return;
    }

    const date2 = dateRef.format(establishDateFormat);
    const dateTimestamp = (new Date(date2).getTime() / 1000 - 8 * 3600) | 0;

    const h = timeRef.$d.getHours();
    const m = timeRef.$d.getMinutes();
    const s = timeRef.$d.getSeconds();

    const timeTimestamp = h * 3600 + m * 60 + s;
    const timestamp = (dateTimestamp + timeTimestamp) * 1000;

    // console.log(moduleUuid, dateTimestamp, timeTimestamp, timestamp);

    const formatSignalData = signalData.filter((i) => i.payload !== "");

    const d = { moduleUuid, timestamp, data: formatSignalData };

    await gatewayReceiveSignal(d);

    // 时间追加2秒
    const oldDay = signalTestTime.value;
    const newTimestamp = oldDay.toDate().getTime() + 2 * 1000;
    const newDay = dayjs(newTimestamp);
    signalTestTime.value = newDay;
  }

  /** 模拟视频发送 */
  async function mockVideoPost() {
    const messageId = videoTestData.messageId;
    const videoUrl = videoTestData.videoTestUrl;
    const startDate = dayjs(videoTestData.startDate).format("YYYY-MM-DD HH:mm:ss");
    console.log(startDate);
    const endDate = dayjs(videoTestData.endDate).format("YYYY-MM-DD HH:mm:ss");
    console.log(endDate); 

    // if (!messageId || !videoUrl || !startDate || !endDate) {
    //   message.warn("请填写完整参数");
    //   return;
    // }

    const res = await gatewayReceiveVideo({ messageId, videoUrl });
    console.log(res);
    // await getVideoStorageAddress({ messageId, startDate, endDate });
  }
  async function mockVideoPost2() {
    const messageId = videoTestData.messageId;
    const videoUrl = videoTestData.videoTestUrl;
    const startDate = dayjs(videoTestData.startDate).format("YYYY-MM-DD HH:mm:ss");
    console.log(startDate);
    const endDate = dayjs(videoTestData.endDate).format("YYYY-MM-DD HH:mm:ss");
    console.log(endDate); 

    // if (!messageId || !videoUrl || !startDate || !endDate) {
    //   message.warn("请填写完整参数");
    //   return;
    // }

    const res =await getVideoStorageAddress({ messageId, startDate, endDate });
    console.log(res);
  }
  /** 测试模式点击 */
  function handleTestModeClick() {
    isTestMode.value = !isTestMode.value;
  }
</script>

<style></style>
