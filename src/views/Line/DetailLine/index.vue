<template>
  <div v-if="lineInfo" class="linfo">
    <SubTitle2 class="!my-16px" title="基础信息" />
    <Row class="!flex-nowrap">
      <Col class="w-310px h-190px">
        <Form class="detail0" :labelCol="{ style: { width: '110px' } }">
          <Form.Item label="产线编号">{{ lineInfo.lineNo }}</Form.Item>
          <Form.Item label="产线名称">{{ lineInfo.lineName }}</Form.Item>
          <Form.Item label="所属车间">{{ lineInfo.workshopInfo.workshopName }}</Form.Item>
          <Form.Item label="线长">
            {{ lineInfo?.lineLeaderStaffInfo?.staffName }}
          </Form.Item>
          <Form.Item label="创建日期">
            {{ formatDateByDayjs(lineInfo.createTime) }}
          </Form.Item>
          <Form.Item label="节拍上下限">
            {{ lineInfo.beatMin }} ≤ {{ lineInfo.beatBase || "/" }} ≤ {{ lineInfo.beatMax }}
          </Form.Item>
        </Form>
      </Col>

      <Col :span="14" class="flex">
        <section class="linfo-sec">
          <p class="linfo-title">产线展示图片：</p>
          <div class="linfo-main">
            <ImageGallery :urls="lineInfo.imagePaths" />
          </div>
        </section>
        <section class="linfo-sec">
          <p class="linfo-title">产线二维码：</p>
          <div class="linfo-main">
            <ImageGallery :urls="[lineInfo.lineQrcodeUrl]" />
          </div>
        </section>
        <!-- <section class="linfo-sec">
          <p class="linfo-title">产线事件管理员：</p>
          <div class="linfo-main">
            <EventStaffTable
              class="!w-280px"
              :mode="CommonComponentMode.DETAIL"
              v-model:materialEventStaffId="lineInfo.materialEventStaffId"
              v-model:deviceEventStaffId="lineInfo.deviceEventStaffId"
              v-model:qualityEventStaffId="lineInfo.qualityEventStaffId"
              v-model:otherEventStaffId="lineInfo.otherEventStaffId"
            />
          </div>
        </section> -->
      </Col>

    </Row>
    <SubTitle2 class="!my-16px" title="事件管理员" />
    <div style="width: 100%;border: 1px solid #e5e5e5;">
           <readOnly :lineId="lineInfo.id" />
    </div>
    <SubTitle2 class="!my-16px" title="产线工位列表" />
    <div class="area m-24px">
      <section class="sec" :style="{ width: `${secSize}px` }" v-for="station in stationList" :key="station.id">
        <div class="sec-module">
          <ModuleEnable
            :gatewayUuid="station.gatewayUuid"
            :moduleUuid="station.moduleUuid"
            :isUsedAddon="station.isUsedAddon"
            :isUsedWristband="station.isUsedWristband"
            :isUsedGround="station.isUsedGround"
            :isUsedGeneral="station.isUsedGeneral"
            :isUsedScale="station.isUsedScale"
          />
        </div>
        <div class="sec-line">
          <div class="circle"></div>
        </div>
        <p class="sec-text text-gray-400">{{ station.stationNo }}</p>
        <p class="sec-text mb-8px text-gray-400">{{ station.stationName }}</p>
        <p class="sec-text text-gray-400">{{ station.moduleUuid }}</p>

        <div class="sec-qrcode" :style="{ width: `${stationQrcodeSize}px`, height: `${stationQrcodeSize}px` }">
          <div v-if="station.qrcodeUrl" class="text-center">
            <ImageGallery class="imageGallery" :limit="1" :urls="[station.qrcodeUrl!!]" :size="stationQrcodeSize" />
            <Tag v-if="station.staffInfo?.staffName" color="blue" class="!mr-0">
              {{ station.staffInfo?.staffName }}
            </Tag>
          </div>
          <p v-else class="text-warn text-center whitespace-nowrap">【待绑定UID】</p>
        </div>
      </section>
      <p v-if="!stationList.length" class="text-gray-400">暂无产线工位</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { watch, ref, reactive, onMounted } from "vue";
  import { Tooltip, Tag, Form, Row, Radio } from "ant-design-vue";
  import BackBtn from "/@/components/BackBtn/index.vue";
  import SubTitle2 from "/@/components/Title/SubTitle2.vue";
  import ChartBar from "/@/components/Chart/Bar.vue";
  import { lineDateAnaly, lineDetail } from "/@/api/line";
  import { DateTypeList, getListItemLabel } from "/@/config/data";
  import { formatDateByDayjs, getAssetsFile, parseSearch } from "/@/utils/util";
  import { text2QRCode } from "/@/utils/canvas";
  import DateGroup from "/@/components/Application/DateGroup.vue";
  import { LineDetail } from "/@/api/model/line";
  import { createLoading } from "/@/components/Loading/createLoading";
  import ImageGallery from "/@/components/Application/ImageGallery.vue";
  import EventStaffTable from "/@/views/components/EventStaffTable/index.vue";
  import { StaffInfo } from "/@/api/model/staff";
  import { CommonComponentMode } from "/@/enums/commonEnum";
  import { stationListAll } from "/@/api/station";
  import { StationDetail } from "/@/api/model/station";
  import ModuleEnable from "/@/views/components/ModuleEnable/index.vue";
  import readOnly from "../EventStaff/readOnly.vue";
  const lineDemoImg = getAssetsFile("line-demo.jpg");

  const secSize = 180;
  const stationImageSize = 110;
  const stationQrcodeSize = 90;

  const lineId = Number(parseSearch().id);
  const lineInfo = ref<LineDetail>();
  const stationList = ref<StationDetail[]>([]);

  onMounted(async () => {
    const { close } = createLoading();

    await toGetNeedInfo();

    close();
  });

  /** 获取工位列表 */
  async function toGetStationList() {
    const sList = await stationListAll(lineId);

    // 根据工位情况生成二维码
    const promiseList = [];
    for (let i = 0; i < sList.length; i++) {
      const station = sList[i];

      const { stationUuid, stationNo, stationName, staffInfo } = station;

      const staffName = staffInfo?.staffName;
      if (stationUuid) {
        // 采用Promise并发
        const promise = text2QRCode(stationUuid, `${stationNo}-${stationName}`, staffName);

        promiseList.push(promise);
        promise.then((qrcodeUrl: string) => {
          station.qrcodeUrl = qrcodeUrl;
        });
      }
    }

    await Promise.all(promiseList);

    console.log(sList);

    stationList.value = sList;
  }

  /** 获取产线信息 */
  async function toGetLineInfo() {
    // 获取产线详情
    const info = await lineDetail(lineId);

    // 生成产线二维码
    const lineQrcodeUrl = await text2QRCode(
      info.lineUuid,
      `${info.lineNo}-${info.lineName}`,
      info?.lineLeaderStaffInfo?.staffName
    );

    // 注入二维码
    info.lineQrcodeUrl = lineQrcodeUrl;

    lineInfo.value = info;
  }

  /** 获取必要数据 */
  async function toGetNeedInfo() {
    await toGetLineInfo();
    await toGetStationList();
  }
</script>

<style lang="less" scoped>
  .detail0 {
    .ant-row {
      margin-bottom: 4px;
    }
  }
  .linfo {
    &-sec {
      min-width: 150px;
    }
    &-title {
      height: 32px;
      line-height: 32px;
    }
    &-main {
      margin-right: 18px;
    }
  }
  .area {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }
  .sec {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 12px 0 52px;
    &:last-child {
      .sec-line::after {
        display: block;
      }
    }

    &-line {
      position: relative;
      width: 100%;
      height: 2px;
      margin: 10px 0;
      background: #ccc;
      .circle {
        position: absolute;
        width: 10px;
        height: 10px;
        background: @color-primary;
        border-radius: 9999px;
        top: 50%;
        left: 50%;
        transform: translate3d(-50%, -50%, 0);
      }
      &::after {
        content: "";
        display: none;
        position: absolute;
        right: -6px;
        top: 50%;
        transform: translateY(-50%);
        border: 6px solid transparent;
        border-left-color: #ccc;
        border-left-width: 8px;
      }
    }
    &-qrcode {
      object-fit: cover;
    }
  }

  :deep {
    .sec-qrcode {
      .ant-image {
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        &-img {
          width: 130px;
          height: 130px;
        }
      }
    }
  }
</style>
