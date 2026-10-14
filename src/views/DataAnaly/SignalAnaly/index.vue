<template>
  <template v-if="props.detailView">
    <div class="detail-analysis-view">
      <!-- 详情页操作区：跨天登记可以选择具体统计日期，并导出当前日期工时采集数据 -->
      <div class="detail-view-toolbar">
        <div class="detail-view-toolbar__actions">
          <span class="detail-view-toolbar__label">统计日期</span>
          <Select
            v-model:value="detailAnalysisDate"
            class="detail-day-select"
            :options="detailAnalysisDateOptions"
            allowClear
            placeholder="全部登记"
            @change="handleDetailAnalysisDateChange"
          />
          <Button v-if="lineCapacityTopRange" @click="handleCancelLineCapacityTopRange"> 取消时段 </Button>
          <Button type="primary" @click="handleDetailExport">导出</Button>
          <Button type="primary" @click="handleDetailExport2">导出登记详情</Button>
        </div>
      </div>

      <!-- 详情页顶部：显示所选当天、且受登记开始/结束时间约束的岗位总产能 -->
      <section class="detail-top-panel">
        <SubTitle2
          class="!h-32px"
          :title="lineCapacityTopRange ? '时段岗位总产能' : detailAnalysisDate ? '当天岗位总产能' : '岗位登记总产能'"
        />
        <div class="chart1 detail-capacity-chart">
          <ChartBar
            :width="topChartWidth"
            :height="400"
            :title="_getRegistrationCapacityTitle()"
            xLabel="岗位"
            yLabel="产量(件)"
            :xyData="allStationBeatChartData.xyData"
            :xData="allStationBeatChartData.xData"
            :yData="allStationBeatChartData.yData"
            :loading="allStationBeatChartData.loading"
            :chartOptions="detailCapacityChartOptions"
            :itemStyleColor="themeColor.beat"
            :chartClick="handleStationRankChartClick"
          />
        </div>
      </section>

      <!-- 下方：岗位标准小时产能 + 当日线平衡，中间分隔条可左右拖拽 -->
      <div ref="detailBottomPanelRef" class="detail-bottom-panels" :style="{ gridTemplateColumns: detailGridTemplate }">
        <section class="detail-bottom-panel detail-hour-panel">
          <div class="panel-header">
            <SubTitle2 class="panel-header__title" :title="chartType === 'normal' ? '岗位节拍趋势' : '岗位小时产能'" />

            <div class="panel-header__actions">
              <a-button
                v-if="chartType === 'normal' && hourlyCapacityDrilldownRange"
                size="small"
                @click="handleBackToHourlyCapacity"
              >
                返回小时产能
              </a-button>

              <!-- <a-dropdown>
                <a-button size="small">切换图表
                  <DownOutlined />
                </a-button>
                <template #overlay>
                  <a-menu :selectedKeys="[chartType]" @click="handleDetailChartTypeMenuClick">
                    <a-menu-item key="normal">节拍折线图</a-menu-item>
                    <a-menu-item key="hour">小时产能</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown> -->

              <a-switch
                v-if="chartType === 'normal'"
                v-model:checked="checked"
                checked-children="显示异常点"
                un-checked-children="关闭异常点"
                @change="handleAbnormalPointChange"
              />
            </div>
          </div>

          <div class="chart1">
            <!-- 钻取后的节拍趋势 -->
            <ChartBar
              v-if="chartType === 'normal'"
              :width="detailLeftWidth"
              :height="340"
              :title="_getData2Title()"
              xLabel="信号时间"
              yLabel="时间消耗(秒)"
              :xyData="stationBeatChartData.xyData"
              :xData="stationBeatChartData.xData"
              :yData="stationBeatChartData.yData"
              :loading="stationBeatChartData.loading"
              :showTotal="stationBeatChartData.xData != null"
              :TotalIsYDataLength="true"
              :chartOptions="chart2Options"
              :itemStyleColor="themeColor.beat"
              :markLineValue="stationBeatChartData.markLineValue"
              :todayRecordsTotal="stationBeatChartData.todayRecordsTotal"
              :chartClick="handleStationChartClick"
            />

            <!-- 默认岗位平均小时产能；点击柱子仍钻取到对应时段的节拍折线图 -->
            <ChartBar
              v-else
              :width="detailLeftWidth"
              :height="340"
              :title="_getHourCapacityTitle()"
              xLabel="时段"
              yLabel="平均小时产能(件)"
              :xyData="stationBeatChartData3.xyData"
              :xData="stationBeatChartData3.xData"
              :yData="stationBeatChartData3.yData"
              :loading="stationBeatChartData3.loading"
              :chartOptions="detailHourlyOutputChartOptions"
              :itemStyleColor="themeColor.beat"
              :chartClick="handleHourlyCapacityChartClick"
            />
          </div>
        </section>

        <div
          class="detail-panel-resizer"
          :class="{ 'is-resizing': detailResizing }"
          :style="{ left: detailLeftPercent + '%', cursor: 'col-resize' }"
          title="按住左右拖拽调整宽度，双击恢复默认"
          @mousedown.left="startDetailPanelResize"
          @dblclick="resetDetailPanelWidth"
        ></div>

        <section class="detail-bottom-panel detail-balance-panel" style="padding-left: 10px">
          <div class="line-summary-header">
            <SubTitle2 class="!my-16px">
              <Popover v-if="lineSummaryChartType === 'balance'" placement="top">
                <template #content>
                  <div>
                    <p>当日线体工位数：{{ lineBalanceChartData.stationTotal }}</p>
                    <p>当日线体节拍总和：{{ lineBalanceChartData.lineAvgSum }}</p>
                    <p>当日线体最大节拍：{{ lineBalanceChartData.maxAverageBeat }}</p>
                    <p>
                      当日线体线平衡率：
                      <span class="text-primary">{{ lineBalanceChartData.markLineValue }}%</span>
                    </p>
                  </div>
                </template>
                <span>{{ detailAnalysisDate ? "当日线平衡" : "登记线平衡" }}</span>
              </Popover>
              <span v-else>
                {{ detailAnalysisDate ? "当日产线标准小时产能" : "工单平均小时产能" }}
              </span>
            </SubTitle2>

            <div class="line-summary-switch">
              <a-button
                size="small"
                :type="lineSummaryChartType === 'balance' ? 'primary' : 'default'"
                @click="handleLineSummaryChartTypeChange('balance')"
              >
                线平衡
              </a-button>
              <a-button
                size="small"
                :type="lineSummaryChartType === 'capacity' ? 'primary' : 'default'"
                @click="handleLineSummaryChartTypeChange('capacity')"
              >
                小时产能
              </a-button>
            </div>
          </div>

          <div class="chart1">
            <ChartBar
              v-if="lineSummaryChartType === 'balance'"
              :width="detailRightWidth"
              :height="340"
              :title="_getData4Title()"
              xLabel="时间"
              :yLabel="`&nbsp;&nbsp;&nbsp;&nbsp;线平衡: ${lineBalanceChartData.markLineValue}%`"
              :xyData="lineBalanceChartData.xyData"
              :xData="lineBalanceChartData.xData"
              :yData="lineBalanceChartData.yData"
              :loading="lineBalanceChartData.loading"
              :maxAverageBeat="lineBalanceChartData.maxAverageBeat"
              :chartOptions="chart4Options"
              :itemStyleColor="themeColor.beat"
            />

            <ChartBar
              v-else
              :width="detailRightWidth"
              :height="340"
              :title="_getLineHourlyCapacityTitle()"
              xLabel="时段"
              yLabel="平均小时产能(件)"
              :xyData="lineHourlyCapacityChartData.xyData"
              :xData="lineHourlyCapacityChartData.xData"
              :yData="lineHourlyCapacityChartData.yData"
              :loading="lineHourlyCapacityChartData.loading"
              :chartOptions="lineHourlyCapacityChartOptions"
              :itemStyleColor="lineHourlyCapacityColor"
              :chartClick="handleLineHourlyCapacityChartClick"
            />
          </div>
        </section>
      </div>
    </div>
  </template>

  <template v-else>
    <!-- 上层图表：产线实时节拍 / 当天岗位平均节拍互斥切换 -->
    <div class="top-chart-section">
      <!-- 统一头部：左侧标题 + 右侧操作栏 -->
      <div class="top-chart-header">
        <!-- 左侧动态标题 -->
        <div class="top-chart-title">
          <template v-if="topChartType === 'realtime'">
            <SubTitle2 class="!h-36px">
              <div class="flex">
                <Popover placement="top">
                  <template #content>
                    <div>
                      - 实时分析当前线体下全部工位；<span class="text-warn-d font-bold"
                        >每隔{{ lineBeatChartData.delay / 1000 }}秒</span
                      >刷新
                      <p v-if="isPDXLine(lineInfo?.lineType)">
                        - 皮带线通过<span class="text-warn-d font-bold">【秤盘重量变化信号】</span>反向计算节拍
                      </p>
                      <p v-else>
                        - 工装板线通过<span class="text-warn-d font-bold"
                          >【{{ lineBeatBaseDouble }}秒内最近信号与上次信号 的时耗】</span
                        >即节拍；
                      </p>
                      -
                      <span class="text-gray-400">
                        [节拍范围:{{ lineInfo?.beatMin }} ≤
                        <span class="text-primary font-bold">{{ virtualLineInfo?.standardBeat }} [标准]</span> ≤
                        {{ lineInfo?.beatMax }}]
                      </span>
                    </div>
                  </template>
                  <div class="">
                    <QuestionCircleOutlined class="!text-secondary pr-4px" />
                    <span>产线实时节拍</span>
                  </div>
                </Popover>
                <Tag :color="dataPolling ? 'blue' : ''" class="!ml-12px" v-if="currentDate">{{ currentDate }}</Tag>
              </div>
            </SubTitle2>
          </template>
          <template v-else>
            <SubTitle2
              class="!h-36px"
              :title="isHourRank ? '当天平均标准小时产能排行' : '当天岗位平均节拍' + showTime"
            />
          </template>
        </div>

        <!-- 右侧操作栏 -->
        <div class="top-chart-actions">
          <!-- <a-button
            danger
            size="small"
            :loading="lineRateBackfillState.running"
            :disabled="lineRateBackfillState.running"
            @click="handleCompleteRegistrationLineRate"
          >
            {{
              lineRateBackfillState.running
                ? `补全中 ${lineRateBackfillState.current}/${lineRateBackfillState.total}`
                : "一次性补全登记线平衡"
            }}
          </a-button> -->

          <!-- 时间筛选组 -->
          <div class="action-group">
            <a-time-range-picker
              v-if="topChartType == 'rank'"
              v-model:value="timeRange"
              format="HH:mm"
              :allowClear="true"
              :minuteStep="1"
              :secondStep="60"
              :showNow="false"
              :hideDisabledOptions="true"
              size="small"
              @change="handleTimeRangeChange"
            />
            <a-button v-if="isCustomTimeRange" type="link" size="small" @click="cancelTimeRange"> 取消筛选 </a-button>
          </div>
          <a-button
            size="small"
            @click="handleTopChartTypeChange('realtime')"
            :type="topChartType === 'realtime' ? 'primary' : ''"
          >
            产线实时节拍
          </a-button>
          <a-button
            size="small"
            @click="handleTopChartTypeChange('rank')"
            :type="topChartType !== 'realtime' ? 'primary' : ''"
          >
            当天岗位平均节拍
          </a-button>
        </div>
      </div>

      <!-- 图表区域 -->
      <template v-if="topChartType === 'realtime'">
        <div class="chart1 my-24px" :class="{ 'is-fullscreen': isFullscreen }">
          <div class="chart-toolbar">
            <FullscreenOutlined v-if="!isFullscreen" @click="enterFullscreen" />
            <FullscreenExitOutlined v-else @click="exitFullscreen" />
          </div>
          <ChartBar
            :fullscreen="isFullscreen"
            :width="topChartWidth"
            :height="chartHeight"
            :title="_getData1Title()"
            xLabel="工位"
            yLabel="时间消耗(秒)"
            :xyData="lineBeatChartData.xyData"
            :xData="lineBeatChartData.xData"
            :yData="lineBeatChartData.yData"
            :loading="lineBeatChartData.loading"
            :chartOptions="chart1Options"
            :itemStyleColor="themeColor['primary-l']"
            :chartClick="handleLineChartClick"
            :markLineValue="lineBeatChartData.markLineValue"
            :maxLabel="lineBeatChartData.maxLabel"
          />
        </div>
      </template>
      <template v-else>
        <div class="chart1 my-24px">
          <ChartBar
            :width="topChartWidth"
            :height="450"
            :title="_getData3Title()"
            xLabel="岗位"
            :yLabel="isHourRank ? '平均标准小时产能(件)' : '平均节拍(秒)'"
            :xyData="allStationBeatChartData.xyData"
            :xData="allStationBeatChartData.xData"
            :yData="allStationBeatChartData.yData"
            :loading="allStationBeatChartData.loading"
            :chartOptions="topRankChartOptions"
            :itemStyleColor="themeColor.beat"
            :markLineValue="allStationBeatChartData.markLineValue"
            :maxLabel="isHourRank ? '' : lineBeatChartData.maxLabel"
            :chartClick="handleStationRankChartClick"
          />
        </div>
      </template>
    </div>

    <!-- 下层图表：岗位节拍趋势 / 当日线平衡 -->
    <div ref="normalBottomPanelRef" class="normal-bottom-panels" :style="{ gridTemplateColumns: normalGridTemplate }">
      <section class="normal-bottom-panel normal-hour-panel">
        <!-- 头部：标题靠左，操作靠右，窄屏自动换行 -->
        <div class="panel-header">
          <SubTitle2 class="panel-header__title" :title="chartType !== 'hour' ? '岗位节拍趋势' : '岗位小时产能'" />

          <div class="panel-header__actions">
            <a-button
              v-if="chartType === 'normal' && hourlyCapacityDrilldownRange"
              size="small"
              @click="handleBackToHourlyCapacity"
            >
              返回小时产能
            </a-button>

            <a-dropdown>
              <a-button size="small"
                >切换图表
                <DownOutlined />
              </a-button>
              <template #overlay>
                <a-menu :selectedKeys="[chartType]" @click="handleChartTypeMenuClick">
                  <a-menu-item key="normal">常规</a-menu-item>
                  <a-menu-item key="5">5s</a-menu-item>
                  <a-menu-item key="10">10s</a-menu-item>
                  <a-menu-item key="15">15s</a-menu-item>
                  <a-menu-item key="30">30s</a-menu-item>
                  <a-menu-item key="hour">小时产能</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>

            <a-popover placement="bottomRight">
              <template #content>
                <div class="flex items-center">
                  <span>标准工时：</span> <span>{{ virtualLineInfo?.standardBeat }}秒</span>
                </div>
                <div class="flex items-center">
                  <span>目前单次时间:</span>
                  <span>{{ stationBeatChartData.yData[stationBeatChartData.yData.length - 1] }}秒</span>
                </div>
                <div class="flex items-center">
                  <span>累计时间平均值：</span> <span>{{ stationBeatChartData.average }}秒</span>
                </div>
                <div class="flex items-center">
                  <span>超出预设上限次数:</span>
                  <span>{{
                    exceedAvgCount - selectVirtualStationInfo.exceedAvgBeatMax > 0
                      ? exceedAvgCount - selectVirtualStationInfo.exceedAvgBeatMax
                      : 0
                  }}</span>
                </div>
                <div class="flex items-center">
                  <span>超过标准上限次数:</span> <span>{{ selectVirtualStationInfo.exceedAvgBeatMax }}</span>
                </div>
              </template>
              <template #title>
                <span>实际节拍数据与标准工时的差异性</span>
              </template>
              <a-button size="small">查看</a-button>
            </a-popover>

            <a-switch
              v-if="chartType === 'normal'"
              v-model:checked="checked"
              checked-children="显示异常点"
              un-checked-children="关闭异常点"
              @change="handleAbnormalPointChange"
            />
          </div>
        </div>

        <!-- 图表主体 -->
        <div class="chart-wrapper">
          <ChartBar
            v-if="chartType === 'normal'"
            :width="chartWidth"
            :height="chartHeight"
            :title="_getData2Title()"
            xLabel="信号时间"
            yLabel="时间消耗(秒)"
            :xyData="stationBeatChartData.xyData"
            :xData="stationBeatChartData.xData"
            :yData="stationBeatChartData.yData"
            :loading="stationBeatChartData.loading"
            :showTotal="stationBeatChartData.xData != null"
            :TotalIsYDataLength="true"
            :chartOptions="chart2Options"
            :itemStyleColor="themeColor.beat"
            :markLineValue="stationBeatChartData.markLineValue"
            :todayRecordsTotal="stationBeatChartData.todayRecordsTotal"
            :chartClick="handleStationChartClick"
          />
          <ChartBar
            v-else-if="chartType === 'hour'"
            :width="chartWidth"
            :height="chartHeight"
            :title="_getHourCapacityTitle()"
            xLabel="时段"
            yLabel="小时产能(件)"
            :xyData="stationBeatChartData3.xyData"
            :xData="stationBeatChartData3.xData"
            :yData="stationBeatChartData3.yData"
            :loading="stationBeatChartData3.loading"
            :chartOptions="chartHourOptions"
            :itemStyleColor="themeColor.beat"
            :chartClick="handleHourlyCapacityChartClick"
          />
          <ChartBar
            v-else
            :width="chartWidth"
            :height="chartHeight"
            :title="_getData5Title()"
            xLabel="信号时间"
            yLabel="时间消耗(秒)"
            :showTotal="true"
            :xData="stationBeatChartData2.xData"
            :yData="stationBeatChartData2.yData"
            :loading="stationBeatChartData2.loading"
            :chartOptions="chart5Options"
            :itemStyleColor="themeColor.beat"
          />
        </div>
      </section>

      <div
        class="normal-panel-resizer"
        :class="{ 'is-resizing': normalResizing }"
        :style="{ left: normalLeftPercent + '%', cursor: 'col-resize' }"
        title="按住左右拖拽调整宽度，双击恢复默认"
        @mousedown.left="startNormalPanelResize"
        @dblclick="resetNormalPanelWidth"
      ></div>

      <section class="normal-bottom-panel normal-balance-panel pl-8px">
        <div class="line-summary-header">
          <SubTitle2 class="!my-16px">
            <Popover v-if="lineSummaryChartType === 'balance'" placement="top">
              <template #content>
                <div>
                  <p>当日线体工位数：{{ lineBalanceChartData.stationTotal }}</p>
                  <p>当日线体节拍总和：{{ lineBalanceChartData.lineAvgSum }}</p>
                  <p>当日线体最大节拍：{{ lineBalanceChartData.maxAverageBeat }}</p>
                  <p>
                    当日线体线平衡率：
                    <span class="text-primary">{{ lineBalanceChartData.markLineValue }}%</span>
                  </p>
                </div>
              </template>
              <span>当日线平衡率</span>
            </Popover>
            <span v-else>产线平均小时产能</span>
          </SubTitle2>

          <div class="line-summary-switch">
            <a-button
              size="small"
              :type="lineSummaryChartType === 'balance' ? 'primary' : 'default'"
              @click="handleLineSummaryChartTypeChange('balance')"
            >
              线平衡
            </a-button>
            <a-button
              size="small"
              :type="lineSummaryChartType === 'capacity' ? 'primary' : 'default'"
              @click="handleLineSummaryChartTypeChange('capacity')"
            >
              小时产能
            </a-button>
          </div>
        </div>

        <div class="chart1">
          <ChartBar
            v-if="lineSummaryChartType === 'balance'"
            :width="panelRightWidth"
            :height="320"
            :title="_getData4Title()"
            xLabel="时间"
            :yLabel="`&nbsp;&nbsp;&nbsp;&nbsp;线平衡: ${lineBalanceChartData.markLineValue}%`"
            :xyData="lineBalanceChartData.xyData"
            :xData="lineBalanceChartData.xData"
            :yData="lineBalanceChartData.yData"
            :loading="lineBalanceChartData.loading"
            :maxAverageBeat="lineBalanceChartData.maxAverageBeat"
            :chartOptions="chart4Options"
            :itemStyleColor="themeColor.beat"
          />

          <ChartBar
            v-else
            :width="panelRightWidth"
            :height="320"
            :title="_getLineHourlyCapacityTitle()"
            xLabel="时段"
            yLabel="平均标准小时产能(件)"
            :xyData="lineHourlyCapacityChartData.xyData"
            :xData="lineHourlyCapacityChartData.xData"
            :yData="lineHourlyCapacityChartData.yData"
            :loading="lineHourlyCapacityChartData.loading"
            :chartOptions="lineHourlyCapacityChartOptions"
            :itemStyleColor="lineHourlyCapacityColor"
            :chartClick="handleLineHourlyCapacityChartClick"
          />
        </div>
      </section>
    </div>
  </template>
  <Modal v-model:visible="madalData.visible" title="节拍视频" :width="1200" :footer="null" destroyOnClose>
    <WebDavVideoModal :url="madalData.videoUrl"></WebDavVideoModal>
  </Modal>
</template>

<script setup lang="ts">
  import {
    withDefaults,
    defineProps,
    defineEmits,
    defineExpose,
    unref,
    onUnmounted,
    computed,
    reactive,
    onMounted,
    onBeforeUnmount,
    ref,
    shallowRef,
  } from "vue";
  import { Select, Popover, Tag, InputNumber, Table, Button, Modal, message } from "ant-design-vue";
  import { StationInfo } from "/@/api/model/station";
  import ChartBar from "/@/components/Chart/Bar.vue";
  import SubTitle2 from "/@/components/Title/SubTitle2.vue";
  import DateGroup from "/@/components/Application/DateGroup.vue";
  import { IntervalHandle } from "/#/global";
  import * as XLSX from "xlsx";
  import * as XLSXStyle from "xlsx-js-style";
  import {
    QuestionCircleOutlined,
    ReloadOutlined,
    SettingOutlined,
    DownOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined,
  } from "@ant-design/icons-vue";
  import { signalSpecifyDateData } from "/@/api/signal";
  import { debounce, formatDateByDayjs, parseSearch } from "/@/utils/util";
  import { EChartsOption } from "echarts";
  import { themeColor } from "/@/settings/var";
  import { numberToFixed } from "/@/utils/math";
  import { addOutOfAverage, beatExceptionAdd, getOutOfAverage } from "/@/api/beatException";
  import type { BeatExceptionInfo } from "/@/api/model/beatException";
  import { registrationEdit, registrationList } from "../../../api/registration";
  import {
    formatSignal2ChartData,
    formatHourlyCapacityChartData,
    formatSignalStations,
    formatSignalStationsRealTimeChartData,
    formatSignalAllStationRankData,
    formatSignalAllStationHourlyCapacityRankData,
    formatSignalAllStationRegistrationCapacityData,
    formatLineHourlyCapacityChartData,
    formatBalanceListChartData,
    genLineBalanceHtml,
    transformScale2General,
  } from "../format";
  import dayjs, { Dayjs } from "dayjs";
  import { BeatType, DateType, RegistrationStatus, SubModuleType } from "/@/enums/model";
  import { DEFAULT_BEAT_BASE, defaultPageSize, REGISTRATION_NO_END_DATE_OFFSET } from "/@/config";
  import { useStationRankTable } from "./useTable";
  import { createLoading } from "/@/components/Loading/createLoading";
  import { useAppStore, useDataStore } from "/@/store";
  import { maxPageSize } from "/@/config";
  import { SignalDataInfo } from "/@/api/model/signal";
  import { replaceUrlQuery } from "/@/utils/router";
  import { panelWholeWidth, useData } from "../useData";
  import { useChartData } from "./data";
  import { virtualStationDetail } from "/@/api/virtualStation";
  import { formatRegistrationEndDate, getVirtualStationText, isPDXLine } from "/@/config/parse";
  import { useStationStore } from "/@/store";
  import { getVideoStorageAddress } from "/@/api/gateway";
  import { registrationDetailGetByLatest } from "/@/api/registration";
  import { virtualLineDetail } from "/@/api/virtualLine";
  import { staffSignFindByRegId } from "/@/api/staffSign";
  import WebDavVideoModal from "./WebDavVideoModal.vue";
  const stationStore = useStationStore();
  const checked = ref(false);

  /** 产线平均小时产能柱状图独立颜色，与线平衡绿色区分。 */
  const lineHourlyCapacityColor = "#5B8FF9";

  /** 右侧汇总图：线平衡 / 产线标准小时产能 */
  const lineSummaryChartType = ref<"balance" | "capacity">("balance");

  /**
   * 详情页点击“产线标准小时产能”后的顶部岗位总产能统计区间。
   * null 表示顶部仍按当前登记/统计日整体范围统计。
   */
  const lineCapacityTopRange = ref<{
    label: string;
    startTimestamp: number;
    endTimestamp: number;
  } | null>(null);

  /** 产线标准小时产能折线图数据 */
  const lineHourlyCapacityChartData = reactive({
    loading: false,
    xData: [] as string[],
    yData: [] as number[],
    xyData: [] as any[],
    markLineValue: 0,
  });

  const WEBDAV_VIDEO_BASE_URL = "http://183.249.77.50:5005/video";
  const props = withDefaults(
    defineProps<{
      /** 生产登记详情专用：显示岗位登记总产能、岗位标准小时产能、当日线平衡 */
      detailView?: boolean;
      /** 生产登记详情传入的登记信息，用于历史日期分析 */
      info?: any;
    }>(),
    {
      detailView: false,
      info: undefined,
    }
  );

  const madalData = ref({
    visible: false,
    videoUrl: "",
  });

  function buildWebDavVideoUrl(videoStorageAddress: string) {
    const address = String(videoStorageAddress || "").trim();
    if (!address) return "";

    if (/^https?:\/\//i.test(address)) {
      return address;
    }

    const baseUrl = new URL(`${WEBDAV_VIDEO_BASE_URL.replace(/\/+$/, "")}/`);
    const basePath = baseUrl.pathname.replace(/^\/+|\/+$/g, "");
    let normalizedPath = address.replace(/\\/g, "/").replace(/^\/+/, "");

    // 兼容接口返回值本身已带 /video 前缀，避免最终地址出现 /video/video/。
    if (normalizedPath === basePath) {
      normalizedPath = "";
    } else if (basePath && normalizedPath.startsWith(`${basePath}/`)) {
      normalizedPath = normalizedPath.slice(basePath.length + 1);
    }

    return new URL(normalizedPath, baseUrl).toString();
  }

  function handleVideoModalClosed() {
    madalData.value.videoUrl = "";
  }
  /** 生产登记详情当前选择的统计日期。 */
  const detailAnalysisDate = ref<string>("");
  const lastDetailRegistrationId = ref<string>("");

  function getDetailRegistrationInfo() {
    return registrationInfo.value || props.info;
  }

  /** 登记真正可统计的结束时间：已结束取 endDate，进行中取当前时间。 */
  function getDetailRegistrationEffectiveEndTimestamp() {
    const rInfo = getDetailRegistrationInfo();
    const now = Date.now();

    if (!rInfo?.endDate || rInfo?.registrationStatus === RegistrationStatus.IN_REGISTRATION) {
      return now;
    }

    return Math.min(dayjs(rInfo.endDate).valueOf(), now);
  }

  /** 当前登记实际包含的自然日列表。 */
  const detailAnalysisDateOptions = computed(() => {
    const rInfo = getDetailRegistrationInfo();
    if (!rInfo?.startDate) return [];

    const startDay = dayjs(rInfo.startDate).startOf("day");
    const effectiveEnd = Math.max(dayjs(rInfo.startDate).valueOf(), getDetailRegistrationEffectiveEndTimestamp());

    // endDate 如果正好是次日 00:00:00，则不把这个完全未生产的新日期算进去。
    const lastDay = dayjs(Math.max(dayjs(rInfo.startDate).valueOf(), effectiveEnd - 1)).startOf("day");

    const options: Array<{ label: string; value: string }> = [];
    let cursor = startDay;

    while (!cursor.isAfter(lastDay, "day")) {
      const value = cursor.format("YYYY-MM-DD");
      options.push({
        label: value,
        value,
      });

      cursor = cursor.add(1, "day");
    }

    return options;
  });

  /**
   * 切换到新的生产登记时，统计日期默认不选。
   * 不选日期 = 统计整条登记（登记开始时间 ~ 登记结束时间）。
   */
  function ensureDetailAnalysisDate() {
    if (!props.detailView) return;

    const rInfo = getDetailRegistrationInfo();
    if (!rInfo?.startDate) return;

    const registrationKey = String(rInfo.id ?? rInfo.registrationNo ?? rInfo.startDate);
    const validDateSet = new Set(detailAnalysisDateOptions.value.map((item) => item.value));

    if (lastDetailRegistrationId.value !== registrationKey) {
      lastDetailRegistrationId.value = registrationKey;
      detailAnalysisDate.value = "";
      return;
    }

    // 已选择的日期不属于当前登记时，恢复“全部登记”。
    if (detailAnalysisDate.value && !validDateSet.has(detailAnalysisDate.value)) {
      detailAnalysisDate.value = "";
    }
  }

  /**
   * 详情页有效统计区间：[start, end)
   *
   * - 未选择统计日期：登记开始时间 ~ 登记结束时间
   * - 选择统计日期：max(当天00:00, 登记开始) ~ min(次日00:00, 登记结束)
   */
  const detailAnalysisDayRange = computed(() => {
    if (!props.detailView) return null;

    const rInfo = getDetailRegistrationInfo();
    if (!rInfo?.startDate) return null;

    const registrationStartTimestamp = dayjs(rInfo.startDate).valueOf();
    const registrationEndTimestamp = getDetailRegistrationEffectiveEndTimestamp();

    if (!detailAnalysisDate.value) {
      return {
        dayTimestamp: undefined,
        startTimestamp: registrationStartTimestamp,
        endTimestamp: Math.max(registrationStartTimestamp, registrationEndTimestamp),
        isDayFilter: false,
      };
    }

    const selectedDay = dayjs(detailAnalysisDate.value).startOf("day");
    const dayStartTimestamp = selectedDay.valueOf();
    const dayEndTimestamp = selectedDay.add(1, "day").valueOf();

    const startTimestamp = Math.max(dayStartTimestamp, registrationStartTimestamp);
    const endTimestamp = Math.min(dayEndTimestamp, registrationEndTimestamp);

    return {
      dayTimestamp: dayStartTimestamp,
      startTimestamp,
      endTimestamp: Math.max(startTimestamp, endTimestamp),
      isDayFilter: true,
    };
  });

  /** 为所选日期保留每个工位在区间开始前最后一条信号，保证首个节拍可以正确计算。 */
  function getBeatRecordsInDetailDay(records: SignalDataInfo[]) {
    if (!props.detailView) return records;

    const range = detailAnalysisDayRange.value;
    if (!range || range.endTimestamp <= range.startTimestamp) return [];

    const previousSignalMap = new Map<number, SignalDataInfo>();
    const selectedRecords: SignalDataInfo[] = [];

    for (const record of records) {
      if (record.timestamp < range.startTimestamp) {
        const previous = previousSignalMap.get(record.stationId);
        if (!previous || previous.timestamp < record.timestamp) {
          previousSignalMap.set(record.stationId, record);
        }
      } else if (record.timestamp < range.endTimestamp) {
        selectedRecords.push(record);
      }
    }

    return [...previousSignalMap.values(), ...selectedRecords];
  }

  /**
   * 统计日期切换：
   * - 选择日期：按当天统计
   * - 清空日期：恢复整条登记开始/结束时间
   */
  async function handleDetailAnalysisDateChange(value?: string) {
    detailAnalysisDate.value = value || "";
    lineCapacityTopRange.value = null;
    hourlyCapacityDrilldownRange.value = null;
    chartType.value = "hour";

    resetTimeRangeToRegistration();

    closeLineDataInterval();
    clearAllChart();

    await toGetAllStationSignal();
    await renderAllChart();

    const rInfo = getDetailRegistrationInfo();
    const shouldPoll =
      rInfo?.registrationStatus === RegistrationStatus.IN_REGISTRATION &&
      (!detailAnalysisDate.value || dayjs(detailAnalysisDate.value).isSame(dayjs(), "day"));

    if (shouldPoll) {
      await openLineDataInterval();
    }
  }

  const timeRange = ref<[Dayjs, Dayjs] | null>(null);
  /** 只有用户手动修改过时间范围时，才显示“取消筛选”。 */
  const isCustomTimeRange = ref(false);

  /**
   * 获取当前分析日内，生产登记真正有效的默认时间范围。
   *
   * 例如登记跨天：
   * - 登记开始日：登记开始时间 ~ 24:00
   * - 中间日期：00:00 ~ 24:00
   * - 登记结束日：00:00 ~ 登记结束时间
   *
   * 这样登记开始时间在前一天时，当前日开始时间固定是当天 00:00，
   * 不会再出现前一天 23:00。
   */
  function getDefaultRegistrationTimeRange() {
    const rInfo = registrationInfo.value || props.info;
    if (!rInfo?.startDate) return null;

    // 生产登记详情直接复用 detailAnalysisDayRange：
    // 无统计日期 = 整条登记；有统计日期 = 当前自然日与登记交集。
    if (props.detailView) {
      const range = detailAnalysisDayRange.value;
      if (!range || range.endTimestamp <= range.startTimestamp) return null;

      const start = dayjs(range.startTimestamp);
      const end = dayjs(range.endTimestamp);

      return {
        start,
        end,
        label: detailAnalysisDate.value
          ? `${start.format("HH:mm")}-${end.format("HH:mm")}`
          : `${start.format("YYYY-MM-DD HH:mm")}-${end.format("YYYY-MM-DD HH:mm")}`,
        startTimestamp: range.startTimestamp,
        endTimestamp: range.endTimestamp,
      };
    }

    // 普通数据分析页保持原来的当天统计口径。
    const dayStart = analysisDay.value.startOf("day");
    const dayEnd = dayStart.add(1, "day");

    const registrationStart = dayjs(rInfo.startDate);
    const registrationEnd =
      rInfo.endDate && rInfo.registrationStatus !== RegistrationStatus.IN_REGISTRATION ? dayjs(rInfo.endDate) : dayjs();

    const start = registrationStart.isAfter(dayStart) ? registrationStart : dayStart;
    const end = registrationEnd.isBefore(dayEnd) ? registrationEnd : dayEnd;

    if (!start.isBefore(end)) return null;

    return {
      start,
      end,
      label: `${start.format("HH:mm")}-${end.format("HH:mm")}`,
      startTimestamp: start.valueOf(),
      endTimestamp: end.valueOf(),
    };
  }

  /** 普通分析页默认不选择时间范围。 */
  function clearTimeRangeSelection() {
    timeRange.value = null;
    selectedHourTrendRange.value = null;
    isCustomTimeRange.value = false;
  }

  /** 恢复为“登记开始时间 ~ 登记结束时间（并限制在当前自然日内）”。 */
  function resetTimeRangeToRegistration() {
    const range = getDefaultRegistrationTimeRange();

    if (!range) {
      timeRange.value = null;
      selectedHourTrendRange.value = null;
      isCustomTimeRange.value = false;
      return false;
    }

    timeRange.value = [range.start, range.end];
    selectedHourTrendRange.value = {
      label: range.label,
      startTimestamp: range.startTimestamp,
      endTimestamp: range.endTimestamp,
    };
    isCustomTimeRange.value = false;
    return true;
  }

  const emits = defineEmits(["lineChartStationClick"]);
  const setIsFirst = (val: boolean) => {
    isFisrt.value = val;
  };

  async function pausePanel() {
    closeLineDataInterval();
  }
  const setFiltration = (val: boolean) => {
    isFiltration.value = val;
  };
  defineExpose({
    reRenderAllChart,
    pausePanel,
    setIsFirst,
    setFiltration,
    completeRegistrationLineRateOnce,
  });

  const {
    lineId,
    lineInfo,
    lineList,
    staffList,
    registrationId,
    registrationInfo,
    registrationStartDate,
    virtualStationList,
    virtualLineInfo,
    selectVirtualStationId,
    selectVirtualStationInfo,

    dataPolling,
  } = useData();

  const {
    lineBeatChartData,
    stationBeatChartData,
    stationBeatChartData2,
    stationBeatChartData3,
    allStationBeatChartData,
    lineBalanceChartData,

    chart1Options,
    chart2Options,
    chart3Options,
    chart4Options,
    chart5Options,
    chartHourOptions,
  } = useChartData();

  const searchParams = parseSearch();
  const appStore = useAppStore();
  const topChartWidth = computed(() => panelWholeWidth.value);
  const chartHeight = 340;

  /** 详情页登记总产能图：覆盖平均节拍图原有 tooltip，避免仍显示“平均节拍”。 */
  /**
   * 普通数据分析页顶部岗位排行图。
   * chart3Options 默认 yAxis.name=""，会把 ChartBar 的 yLabel 覆盖掉，
   * 因此这里按当前模式显式恢复左上角单位。
   */
  const topRankChartOptions = computed(() => ({
    ...chart3Options.value,
    yAxis: {
      ...(chart3Options.value?.yAxis || {}),
      name: isHourRank.value ? "平均标准小时产能(件)" : "平均节拍(秒)",
      nameLocation: "end",
      nameGap: 10,
      nameRotate: 0,
    },
  }));

  /** 生产登记详情按工单实际产量展示，不显示不足一小时折算提示。 */
  const detailHourlyOutputChartOptions = computed(() => ({
    ...chartHourOptions.value,
    yAxis: {
      ...(chartHourOptions.value?.yAxis || {}),
      name: "平均小时产能(件)",
      minInterval: 1,
    },
    series: (chartHourOptions.value?.series || []).map((series: any, index: number) =>
      index === 0 ? { ...series, name: "平均小时产能" } : series
    ),
    tooltip: {
      ...(chartHourOptions.value?.tooltip || {}),
      formatter: (params: any) => {
        const param = Array.isArray(params) ? params[0] : params;
        const dataIndex = Number(param?.dataIndex ?? -1);
        const data = stationBeatChartData3.xyData[dataIndex];

        if (!data) return "";

        const formatBeatTime = (value: number | null | undefined) =>
          value === null || value === undefined ? "--" : `${value} 秒`;

        return [
          `时段：${data.label}`,
          `标准小时产能：${data.standardHourlyCapacity} 件/小时`,
          `实际产量：${data.actualCount} 件`,
          `统计时长：${data.coveredMinutes} 分钟`,
          `最小用时：${formatBeatTime(data.minBeatTime)}`,
          `最大用时：${formatBeatTime(data.maxBeatTime)}`,
          `平均用时：${formatBeatTime(data.averageBeatTime)}`,
        ].join("<br/>");
      },
    },
  }));

  /** 所有页面统一展示实际标准小时产能，不对不足一小时的数据做折算。 */
  const lineHourlyCapacityChartOptions = computed(() => ({
    grid: {
      left: "70px",
      right: "8%",
      // 小时时段默认拆成两行，底部多留一点空间。
      bottom: "24%",
      top: "16%",
    },
    title: {
      top: 10,
      left: "center",
    },
    xAxis: {
      type: "category",
      axisLabel: {
        interval: 0,
        hideOverlap: false,
        lineHeight: 16,
        formatter(value: string) {
          const text = String(value || "");
          const lines = text.split("\n");
          const hourRange = lines.pop() || "";

          const match = hourRange.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);

          if (!match) {
            return text;
          }

          // 07:00-08:00 -> 07:00-\n08:00
          // 09-03\n07:00-08:00 -> 09-03\n07:00-\n08:00
          lines.push(`${match[1]}`, match[2]);
          return lines.join("\n");
        },
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      name: props.detailView ? "平均小时产能(件)" : "平均标准小时产能(件)",
      nameGap: 18,
    },
    series: [
      {
        type: "bar",
        barMaxWidth: 32,
        label: {
          show: true,
          position: "top",
        },
        itemStyle: {
          color: lineHourlyCapacityColor,
        },
      },
    ],
    tooltip: {
      trigger: "axis",
      formatter(params: any) {
        const param = Array.isArray(params) ? params[0] : params;
        const dataIndex = Number(param?.dataIndex ?? -1);
        const item = lineHourlyCapacityChartData.xyData[dataIndex];

        if (!item) return "";

        return `
          <p style="margin:0 0 6px;">
            <span style="color:#aaa;">时段: </span>
            <span style="color:#1890ff;">${item.label}</span>
          </p>
          <p style="margin:0 0 6px;">
            <span style="color:#aaa;">${props.detailView ? "产线平均小时产能" : "产线平均小时产能"}: </span>
            <span style="color:#1890ff;">${item.averageCapacity} 件</span>
          </p>
          <p style="margin:0 0 6px;">
            <span style="color:#aaa;">岗位产量合计: </span>
            <span style="color:#1890ff;">${item.totalCapacity}</span>
          </p>
          <p style="margin:0 0 6px;">
            <span style="color:#aaa;">有效岗位数: </span>
            <span style="color:#1890ff;">${item.stationTotal}</span>
          </p>
          <p style="margin:0 0 6px;">
            <span style="color:#aaa;">最小用时: </span>
            <span style="color:#1890ff;">${item.minBeatTime ?? "--"}${item.minBeatTime == null ? "" : " 秒"}</span>
          </p>
          <p style="margin:0 0 6px;">
            <span style="color:#aaa;">最大用时: </span>
            <span style="color:#1890ff;">${item.maxBeatTime ?? "--"}${item.maxBeatTime == null ? "" : " 秒"}</span>
          </p>
          <p style="margin:0;">
            <span style="color:#aaa;">平均用时: </span>
            <span style="color:#1890ff;">${item.averageBeatTime ?? "--"}${
          item.averageBeatTime == null ? "" : " 秒"
        }</span>
          </p>
        `;
      },
    },
    dataZoom: [
      {
        type: "inside",
      },
      {
        type: "slider",
        realtime: true,
        zoomLock: false,
      },
    ],
  }));

  const detailCapacityChartOptions = computed(() => ({
    ...chart3Options.value,

    // chart3Options 原本把 yAxis.name 设成了空字符串，
    // 会覆盖 ChartBar 传入的 yLabel，因此详情页这里显式恢复。
    yAxis: {
      ...(chart3Options.value?.yAxis || {}),
      name: "产量(件)",
      nameLocation: "end",
      nameGap: 10,
      nameRotate: 0,
    },

    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: (params: any) => {
        const param = Array.isArray(params) ? params[0] : params;
        const dataIndex = Number(param?.dataIndex || 0);
        const item = allStationBeatChartData.xyData?.[dataIndex];
        const stationName = item?.name || getVirtualStationText(item?.virtualStationInfo || {});
        const totalCapacity = Number(item?.totalCapacity || 0);

        return `
          <div>
            <div>岗位：<span style="color:#1890ff">${stationName || "-"}</span></div>
            <div>${
              lineCapacityTopRange.value ? "时段产能" : detailAnalysisDate.value ? "当天总产能" : "登记总产能"
            }：<span style="color:#1890ff">${totalCapacity} 件</span></div>
          </div>
        `;
      },
    },
  }));

  // 数据分析页下方左右面板：岗位节拍趋势/标准小时产能 + 当日线平衡。
  // 和生产登记详情保持一致，支持拖拽修改左右宽度。
  const normalBottomPanelRef = ref<HTMLElement | null>(null);
  const normalBottomPanelWidth = ref(0);
  const normalLeftPercent = ref(65);
  const NORMAL_LEFT_MIN_WIDTH = 420;
  const NORMAL_RIGHT_MIN_WIDTH = 360;
  let normalResizeObserver: ResizeObserver | null = null;
  const normalResizing = ref(false);

  const normalGridTemplate = computed(() => {
    const left = normalLeftPercent.value;
    return `${left}% ${100 - left}%`;
  });

  const chartWidth = computed(() => {
    const width = normalBottomPanelWidth.value || panelWholeWidth.value;
    return Math.max(0, Math.floor((width * normalLeftPercent.value) / 100));
  });

  const panelRightWidth = computed(() => {
    const width = normalBottomPanelWidth.value || panelWholeWidth.value;
    return Math.max(0, Math.floor(width - chartWidth.value));
  });

  function updateNormalBottomPanelWidth() {
    if (props.detailView) return;
    const width = normalBottomPanelRef.value?.getBoundingClientRect().width || panelWholeWidth.value;
    normalBottomPanelWidth.value = Math.max(0, width);
  }

  function updateNormalPanelPercent(clientX: number) {
    const container = normalBottomPanelRef.value;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0) return;

    const rawPercent = ((clientX - rect.left) / rect.width) * 100;
    let minPercent = 25;
    let maxPercent = 75;

    if (rect.width >= NORMAL_LEFT_MIN_WIDTH + NORMAL_RIGHT_MIN_WIDTH) {
      minPercent = (NORMAL_LEFT_MIN_WIDTH / rect.width) * 100;
      maxPercent = 100 - (NORMAL_RIGHT_MIN_WIDTH / rect.width) * 100;
    }

    normalLeftPercent.value = Math.min(maxPercent, Math.max(minPercent, rawPercent));
  }

  function onNormalPanelMouseMove(event: MouseEvent) {
    if (!normalResizing.value) return;
    event.preventDefault();
    updateNormalPanelPercent(event.clientX);
  }

  function stopNormalPanelResize() {
    if (!normalResizing.value) return;

    normalResizing.value = false;
    document.documentElement.style.cursor = "";
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    document.removeEventListener("mousemove", onNormalPanelMouseMove);
    document.removeEventListener("mouseup", stopNormalPanelResize);
  }

  function startNormalPanelResize(event: MouseEvent) {
    if (props.detailView || event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();
    updateNormalBottomPanelWidth();
    normalResizing.value = true;

    document.documentElement.style.cursor = "col-resize";
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    document.addEventListener("mousemove", onNormalPanelMouseMove, { passive: false });
    document.addEventListener("mouseup", stopNormalPanelResize);
  }

  function resetNormalPanelWidth() {
    normalLeftPercent.value = 65;
  }

  onMounted(() => {
    // console.log(registrationInfo.value || props.info);

    if (props.detailView) return;
    updateNormalBottomPanelWidth();
    if (typeof ResizeObserver !== "undefined") {
      normalResizeObserver = new ResizeObserver(updateNormalBottomPanelWidth);
      if (normalBottomPanelRef.value) normalResizeObserver.observe(normalBottomPanelRef.value);
    }
  });

  onBeforeUnmount(() => {
    stopNormalPanelResize();
    normalResizeObserver?.disconnect();
    normalResizeObserver = null;
  });

  // 生产登记详情下方左右面板支持拖拽改宽度。
  // 这里使用原生 mouse 事件 + 绝对定位热区，避免 ECharts canvas 抢占 pointer 事件。
  const detailBottomPanelRef = ref<HTMLElement | null>(null);
  const detailBottomPanelWidth = ref(0);
  const detailLeftPercent = ref(65);
  const DETAIL_LEFT_MIN_WIDTH = 420;
  const DETAIL_RIGHT_MIN_WIDTH = 360;
  let detailResizeObserver: ResizeObserver | null = null;
  const detailResizing = ref(false);

  const detailGridTemplate = computed(() => {
    const left = detailLeftPercent.value;
    return `${left}% ${100 - left}%`;
  });

  const detailLeftWidth = computed(() => {
    const width = detailBottomPanelWidth.value || panelWholeWidth.value;
    return Math.max(0, Math.floor((width * detailLeftPercent.value) / 100));
  });

  const detailRightWidth = computed(() => {
    const width = detailBottomPanelWidth.value || panelWholeWidth.value;
    return Math.max(0, Math.floor(width - detailLeftWidth.value));
  });

  function updateDetailBottomPanelWidth() {
    if (!props.detailView) return;
    const width = detailBottomPanelRef.value?.getBoundingClientRect().width || panelWholeWidth.value;
    detailBottomPanelWidth.value = Math.max(0, width);
  }

  function updateDetailPanelPercent(clientX: number) {
    const container = detailBottomPanelRef.value;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0) return;

    const rawPercent = ((clientX - rect.left) / rect.width) * 100;

    // 宽度足够时按像素限制两边最小宽度；窄屏时至少保留 25% / 25%。
    let minPercent = 25;
    let maxPercent = 75;
    if (rect.width >= DETAIL_LEFT_MIN_WIDTH + DETAIL_RIGHT_MIN_WIDTH) {
      minPercent = (DETAIL_LEFT_MIN_WIDTH / rect.width) * 100;
      maxPercent = 100 - (DETAIL_RIGHT_MIN_WIDTH / rect.width) * 100;
    }

    detailLeftPercent.value = Math.min(maxPercent, Math.max(minPercent, rawPercent));
  }

  function onDetailPanelMouseMove(event: MouseEvent) {
    if (!detailResizing.value) return;
    event.preventDefault();
    updateDetailPanelPercent(event.clientX);
  }

  function stopDetailPanelResize() {
    if (!detailResizing.value) return;

    detailResizing.value = false;
    document.documentElement.style.cursor = "";
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    document.removeEventListener("mousemove", onDetailPanelMouseMove);
    document.removeEventListener("mouseup", stopDetailPanelResize);
  }

  function startDetailPanelResize(event: MouseEvent) {
    if (!props.detailView || event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();
    updateDetailBottomPanelWidth();
    detailResizing.value = true;

    document.documentElement.style.cursor = "col-resize";
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    // 监听 document，而不是分隔条本身。拖到 ECharts canvas 上仍然持续生效。
    document.addEventListener("mousemove", onDetailPanelMouseMove, { passive: false });
    document.addEventListener("mouseup", stopDetailPanelResize);
  }

  function resetDetailPanelWidth() {
    detailLeftPercent.value = 65;
  }

  onMounted(() => {
    if (!props.detailView) return;
    updateDetailBottomPanelWidth();
    if (typeof ResizeObserver !== "undefined") {
      detailResizeObserver = new ResizeObserver(updateDetailBottomPanelWidth);
      if (detailBottomPanelRef.value) detailResizeObserver.observe(detailBottomPanelRef.value);
    }
  });

  onBeforeUnmount(() => {
    stopDetailPanelResize();
    detailResizeObserver?.disconnect();
    detailResizeObserver = null;
  });
  // const stationBeatChartData2 = ref({});
  const isFullscreen = ref(false);
  const topChartType = ref<"realtime" | "rank">(props.detailView ? "rank" : "realtime");
  const chartType = ref("hour");
  const selectedHourTrendRange = ref<{
    label: string;
    startTimestamp: number;
    endTimestamp: number;
  } | null>(null);
  // 点击标准小时产能柱后的局部钻取范围，仅影响左下角岗位节拍趋势。
  const hourlyCapacityDrilldownRange = ref<{
    label: string;
    startTimestamp: number;
    endTimestamp: number;
  } | null>(null);

  /** 为每个工位保留所选小时前最后一条信号，保证区间内第一个节拍可以正确计算。 */
  function getBeatRecordsInSelectedHours(records: SignalDataInfo[]) {
    const range = selectedHourTrendRange.value;
    if (!range) return records;

    const previousSignalMap = new Map<number, SignalDataInfo>();
    const selectedRecords: SignalDataInfo[] = [];

    for (const record of records) {
      if (record.timestamp < range.startTimestamp) {
        const previous = previousSignalMap.get(record.stationId);
        if (!previous || previous.timestamp < record.timestamp) {
          previousSignalMap.set(record.stationId, record);
        }
      } else if (record.timestamp < range.endTimestamp) {
        selectedRecords.push(record);
      }
    }

    return [...previousSignalMap.values(), ...selectedRecords];
  }

  /** 将用户选择的时间范围绑定到当前分析日，避免跨日偏移。 */
  function setSelectedHours(startTimestamp: number, endTimestamp: number) {
    const analysisDayStart = analysisDay.value.startOf("day");
    const analysisDayEnd = analysisDayStart.add(1, "day");
    const rawStart = dayjs(startTimestamp);
    const rawEnd = dayjs(endTimestamp);

    // 只取“时分秒”，日期始终使用当前分析日。
    let start = analysisDayStart
      .hour(rawStart.hour())
      .minute(rawStart.minute())
      .second(rawStart.second())
      .millisecond(0);

    let end = analysisDayStart.hour(rawEnd.hour()).minute(rawEnd.minute()).second(rawEnd.second()).millisecond(0);

    // TimeRangePicker 的 00:00 作为结束值时，表示当天 24:00。
    if (!end.isAfter(start) && rawEnd.hour() === 0 && rawEnd.minute() === 0) {
      end = analysisDayEnd;
    }

    if (start.isBefore(analysisDayStart)) start = analysisDayStart;
    if (end.isAfter(analysisDayEnd)) end = analysisDayEnd;

    if (!start.isBefore(end)) {
      message.warning("结束时间必须晚于开始时间");
      return false;
    }

    timeRange.value = [start, end];
    selectedHourTrendRange.value = {
      label: `${start.format("HH:mm")}-${end.format("HH:mm")}`,
      startTimestamp: start.valueOf(),
      endTimestamp: end.valueOf(),
    };
    return true;
  }

  /** 按当前小时范围重算实时节拍视图。 */
  function renderLineBeatBySelectedHours() {
    const records = getBeatRecordsInSelectedHours(allStationSignalList.value);
    const { xyData, xData, yData, markLineValue } = formatSignalStationsRealTimeChartData(records);

    lineBeatChartData.xyData = xyData;
    lineBeatChartData.xData = xData;
    lineBeatChartData.yData = yData;
    lineBeatChartData.markLineValue = markLineValue;
  }

  /**
   * 按当前小时范围重算与“时间筛选”有关的图表。
   */
  async function renderSelectedHours() {
    renderLineBeatBySelectedHours();
    await toRenderAllStationBeatData();
    await toRenderStationBeatData();
    await toRenderLineBalanceBeatData();
  }

  // 只有用户从下方菜单主动选择“标准小时产能”时，上方才显示平均标准小时产能排行。
  const isHourRank = ref(false);

  /** 顶部图表切换时，同步下方当前工位的默认图表。 */
  async function handleTopChartTypeChange(type: "realtime" | "rank") {
    topChartType.value = type;
    chartType.value = type === "rank" ? "hour" : "normal";
    hourlyCapacityDrilldownRange.value = null;
    isHourRank.value = false;
    await renderSelectedHours();
    if (type === "realtime") {
      cancelTimeRange();
    }
  }

  // 线体实时节拍数量
  const lineBeatCount = 3;
  // 防止接口响应慢于轮询间隔时出现并发堆积。
  let lineBeatRequesting = false;

  /**
   * 实时模式分层刷新：
   * - 实时节拍：仍按原轮询频率更新；
   * - 顶部岗位排行：最多每 4 秒重算一次；
   * - 线平衡/产线平均小时产能：最多每 10 秒重算一次。
   *
   * 避免新增 1 条信号就 renderAllChart()，把全天数据重复格式化多遍。
   */
  const REALTIME_RANK_REFRESH_MS = 4_000;
  const REALTIME_SUMMARY_REFRESH_MS = 10_000;
  let realtimeAggregateTimer: ReturnType<typeof setTimeout> | null = null;
  let realtimeAggregateRendering = false;
  let realtimeAggregatePending = false;
  let lastRealtimeRankRenderAt = 0;
  let lastRealtimeSummaryRenderAt = 0;

  function clearRealtimeAggregateSchedule() {
    if (realtimeAggregateTimer) {
      clearTimeout(realtimeAggregateTimer);
      realtimeAggregateTimer = null;
    }
    realtimeAggregatePending = false;
  }

  function scheduleRealtimeAggregateRender() {
    realtimeAggregatePending = true;

    if (realtimeAggregateTimer || realtimeAggregateRendering) {
      return;
    }

    const elapsed = Date.now() - lastRealtimeRankRenderAt;
    const delay = Math.max(0, REALTIME_RANK_REFRESH_MS - elapsed);

    realtimeAggregateTimer = setTimeout(() => {
      realtimeAggregateTimer = null;
      void flushRealtimeAggregateRender();
    }, delay);
  }

  async function flushRealtimeAggregateRender() {
    if (realtimeAggregateRendering) {
      realtimeAggregatePending = true;
      return;
    }

    realtimeAggregateRendering = true;
    realtimeAggregatePending = false;

    try {
      await toRenderAllStationBeatData();
      lastRealtimeRankRenderAt = Date.now();

      if (Date.now() - lastRealtimeSummaryRenderAt >= REALTIME_SUMMARY_REFRESH_MS) {
        await toRenderLineBalanceBeatData();
        lastRealtimeSummaryRenderAt = Date.now();
      }
    } finally {
      realtimeAggregateRendering = false;

      if (realtimeAggregatePending) {
        scheduleRealtimeAggregateRender();
      }
    }
  }

  const lineBeatBaseValue = computed(() => {
    if (virtualLineInfo.value) {
      return virtualLineInfo.value.standardBeat || DEFAULT_BEAT_BASE;
    } else {
      return DEFAULT_BEAT_BASE;
    }
  });

  const lineBeatBaseDouble = computed(() => lineBeatBaseValue.value * 3);

  const currentDate = ref("");

  const stationRankData = reactive({
    loading: false,
    pageNo: 1,
    pageSize: defaultPageSize / 2,
    total: 0,
  });
  const isFisrt = ref(true);
  // 线体排行表单
  const { dataSource: stationRankSource, columns: stationRankColumns } = useStationRankTable();

  // 全部工位节拍排行原始数据
  const allStationBeatRankRaw = ref<any[]>([]);
  // 全部工位平均标准小时产能排行原始数据
  const allStationHourlyCapacityRankRaw = ref<any[]>([]);
  // 生产登记详情：当前登记范围内各岗位总产能
  const allStationRegistrationCapacityRaw = ref<any[]>([]);

  async function handleChartTypeMenuClick({ key }: { key: string }) {
    chartType.value = key;
    hourlyCapacityDrilldownRange.value = null;
    isHourRank.value = key === "hour";

    // 全岗位标准小时产能排行计算量较大，只在用户真正切到该模式时计算。
    if (isHourRank.value) {
      await toRenderAllStationBeatData();
      return;
    }

    applyStationRankChartData();

    if (key === "normal") {
      await toRenderStationBeatData();
    }
  }

  /** 生产登记详情只在“节拍折线图 / 平均小时产能”之间切换。 */
  async function handleDetailChartTypeMenuClick({ key }: { key: string }) {
    if (key !== "normal" && key !== "hour") return;

    hourlyCapacityDrilldownRange.value = null;
    chartType.value = key;
    isHourRank.value = false;
    applyStationRankChartData();
    await toRenderStationBeatData();
  }

  /** 切换异常点显示时，只重算当前岗位趋势，不改变其它统计图表口径。 */
  function handleAbnormalPointChange() {
    if (chartType.value === "normal") {
      void toRenderStationBeatData();
    }
  }

  // 原始信号是大数组，只在业务函数中整体读取，不需要 Vue 深度代理每一条记录。
  const allStationSignalList = shallowRef<SignalDataInfo[]>([]);
  const todayAllStationSignalList = shallowRef<SignalDataInfo[]>([]);

  /**
   * 实时增量索引：
   * - signalKeySet：避免每 2 秒从全天数据重新创建 Set；
   * - signalRecordMap：同一信号后续补充字段时，直接更新原始对象；
   * - stationSignalMap：点击/刷新当前岗位时直接 O(1) 取该岗位信号，
   *   不再对全线数据执行 filter。
   */
  const signalKeySet = new Set<string>();
  const signalRecordMap = new Map<string, SignalDataInfo>();
  const stationSignalMap = new Map<number, SignalDataInfo[]>();

  function clearSignalIndexes() {
    signalKeySet.clear();
    signalRecordMap.clear();
    stationSignalMap.clear();
  }

  function rebuildSignalIndexes(records: SignalDataInfo[]) {
    clearSignalIndexes();

    for (const record of records) {
      const key = `${record.stationId}:${record.timestamp}`;
      signalKeySet.add(key);
      signalRecordMap.set(key, record);

      let stationRecords = stationSignalMap.get(record.stationId);
      if (!stationRecords) {
        stationRecords = [];
        stationSignalMap.set(record.stationId, stationRecords);
      }
      stationRecords.push(record);
    }
  }

  /**
   * 实时信号写入索引：
   * - 新信号追加到原始数据；
   * - 相同 stationId + timestamp 的信号若字段发生变化，则原位更新原始对象。
   */
  function upsertSignalIndexes(records: SignalDataInfo[]) {
    const appendedRecords: SignalDataInfo[] = [];
    const changedRecords: SignalDataInfo[] = [];

    for (const record of records) {
      const key = `${record.stationId}:${record.timestamp}`;
      const sourceRecord = signalKeySet.has(key) ? signalRecordMap.get(key) : undefined;

      if (sourceRecord) {
        const changed = Object.keys(record).some((field) => (sourceRecord as any)[field] !== (record as any)[field]);

        if (changed) {
          Object.assign(sourceRecord, record);
          changedRecords.push(sourceRecord);
        }
        continue;
      }

      signalKeySet.add(key);
      signalRecordMap.set(key, record);
      appendedRecords.push(record);
      changedRecords.push(record);

      let stationRecords = stationSignalMap.get(record.stationId);
      if (!stationRecords) {
        stationRecords = [];
        stationSignalMap.set(record.stationId, stationRecords);
      }
      stationRecords.push(record);
    }

    return {
      appendedRecords,
      changedRecords,
    };
  }

  const allStationBeatRaw = ref<any[]>([]);

  onMounted(async () => {
    document.addEventListener("keydown", handleEsc);
  });
  const aboveAverage = computed(
    () => stationBeatChartData.xyData.filter((v) => v.beatTime > stationBeatChartData.average).length
  );
  onUnmounted(() => {
    clearInterval(lineBeatChartData.timer);
  });

  const isFiltration = ref(false);
  /** 暂停渲染 */

  /** 重新渲染全部图表 */
  async function reRenderAllChart() {
    const { close } = createLoading();

    if (props.detailView) {
      ensureDetailAnalysisDate();
    }

    hourlyCapacityDrilldownRange.value = null;

    if (props.detailView) {
      // 详情页继续使用登记实际时间范围。
      resetTimeRangeToRegistration();
    } else {
      // 普通分析页默认不选择时间筛选。
      clearTimeRangeSelection();
    }

    if (props.detailView) {
      topChartType.value = "rank";
      chartType.value = "hour";
      isHourRank.value = false;
    } else {
      chartType.value = topChartType.value === "rank" ? "hour" : "normal";
      isHourRank.value = false;
    }
    // 先清空全部数据
    clearAllChart();

    const rid = registrationId.value;
    const rInfo = registrationInfo.value;

    if (rid) {
      // 先获取全工位信号数据（图表必须数据）
      await toGetAllStationSignal();
      await renderAllChart();

      const shouldPoll =
        rInfo &&
        rInfo.registrationStatus === RegistrationStatus.IN_REGISTRATION &&
        (!props.detailView || !detailAnalysisDate.value || dayjs(detailAnalysisDate.value).isSame(dayjs(), "day"));

      if (shouldPoll) {
        // 仅当前自然日的进行中登记才开启轮询
        openLineDataInterval();
      } else {
        renderRealTimeStationList();
        closeLineDataInterval();
      }
    } else {
      // 关闭轮询
      closeLineDataInterval();
    }

    close();
  }

  function autoFitExportColumns(data: any[], headers: string[]) {
    const colWidths = headers.map((header) => header.length);

    data.forEach((row) => {
      headers.forEach((header, index) => {
        const value = row?.[header] == null ? "" : String(row[header]);
        colWidths[index] = Math.max(colWidths[index], value.length);
      });
    });

    return colWidths.map((width) => ({ wch: Math.min(width + 2, 50) }));
  }

  /** 生产登记详情：导出当前所选日期内的工时采集数据。 */
  async function handleDetailExport() {
    if (!registrationId.value) return;
    const staffSignList = await staffSignFindByRegId(registrationId.value);

    // 一个工位可能对应多条员工登记，按物理工位 stationId 汇总并去重。
    const stationStaffNameMap = new Map<number, Set<string>>();
    for (const sign of Array.isArray(staffSignList) ? staffSignList : []) {
      const signInfo = sign as any;
      const stationId = Number(
        signInfo?.stationId ?? signInfo?.virtualStationInfo?.stationId ?? signInfo?.virtualStationInfo?.stationInfo?.id
      );
      const staffName = signInfo?.staffInfo?.staffName || signInfo?.staffName || "";
      if (!stationId || !staffName) continue;

      const staffNameSet = stationStaffNameMap.get(stationId) || new Set<string>();
      staffNameSet.add(staffName);
      stationStaffNameMap.set(stationId, staffNameSet);
    }

    /** beatData 使用信号中的物理工位 ID，与员工登记的 stationId 对应。 */
    function getBeatStationStaffNames(item: any) {
      const stationId = Number(
        item?.second?.stationId ??
          item?.first?.stationId ??
          item?.virtualStationInfo?.stationId ??
          item?.virtualStationInfo?.stationInfo?.id
      );
      const staffNameSet = stationStaffNameMap.get(stationId);

      return staffNameSet?.size ? Array.from(staffNameSet).join(",") : "/";
    }

    const rInfo = getDetailRegistrationInfo();
    const lInfo = lineInfo.value;
    const range = detailAnalysisDayRange.value;

    if (!props.detailView || !rInfo || !lInfo || !range) return;

    const sourceRecords = getBeatRecordsInDetailDay(allStationSignalList.value);
    const beatData = formatSignal2ChartData(sourceRecords);

    const rows = beatData.xyData.map((item: any) => ({
      产线编号: lInfo.lineNo,
      关联车间: lInfo.workshopInfo?.workshopNo || lInfo.workshopInfo?.workshopName || "/",
      生产产线: lInfo.lineName,
      线长: lInfo.lineLeaderStaffInfo?.staffName || "/",
      工位编号: item.virtualStationInfo?.stationInfo?.stationNo || "/",
      工位名称: item.virtualStationInfo?.virtualStationName || "/",
      工位绑定员工: getBeatStationStaffNames(item),
      登记编号: rInfo.registrationNo,
      生产产品: rInfo.productInfo?.productName || "/",
      登记开始时间: formatDateByDayjs(rInfo.startDate, "YYYY-MM-DD HH:mm:ss"),
      登记结束时间: rInfo.endDate ? formatDateByDayjs(rInfo.endDate, "YYYY-MM-DD HH:mm:ss") : "/",
      节拍开始时间: formatDateByDayjs(item.first.timestamp, "YYYY-MM-DD HH:mm:ss"),
      节拍结束时间: formatDateByDayjs(item.second.timestamp, "YYYY-MM-DD HH:mm:ss"),
      节拍: item.beatTime,
    }));

    if (!rows.length) {
      message.warning(`${detailAnalysisDate.value ? analysisDateText.value : "当前登记"} 没有可导出的工时采集数据`);
      return;
    }

    Modal.confirm({
      title: detailAnalysisDate.value
        ? `确认导出 ${analysisDateText.value} 工时采集数据？`
        : "确认导出整条生产登记工时采集数据？",
      content: detailAnalysisDate.value
        ? "将导出当前选择日期内、且位于生产登记有效时间范围内的数据。"
        : "将导出登记开始时间到登记结束时间内的全部工时采集数据。",
      okText: "确认",
      cancelText: "取消",
      onOk: () => {
        const headers = [
          "产线编号",
          "关联车间",
          "生产产线",
          "线长",
          "工位编号",
          "工位名称",
          "工位绑定员工",
          "登记编号",
          "生产产品",
          "登记开始时间",
          "登记结束时间",
          "节拍开始时间",
          "节拍结束时间",
          "节拍",
        ];

        const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
        worksheet["!cols"] = autoFitExportColumns(rows, headers);

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "工时采集");
        XLSX.writeFile(workbook, `工时采集-${rInfo.registrationNo}-${analysisDateText.value}.xlsx`);
      },
    });
  }

  /** 导出2：匹配生产登记模板，按日期、物理工位统计产出及节拍。 */
  /** 导出2：匹配生产登记模板，按日期、物理工位统计产出及节拍。 */
  async function handleDetailExport2() {
    const rInfo = getDetailRegistrationInfo() as any;
    const lInfo = lineInfo.value;
    const range = detailAnalysisDayRange.value;

    if (!props.detailView || !rInfo || !lInfo || !range) {
      message.warning("暂无可导出的生产登记数据");
      return;
    }

    console.log(rInfo, lInfo);

    Modal.confirm({
      title: detailAnalysisDate.value
        ? `确认导出 ${analysisDateText.value} 生产登记详情？`
        : "确认导出整条生产登记详情？",
      content: detailAnalysisDate.value
        ? "将按当前选择日期内、且位于生产登记有效时间范围内的数据生成生产登记表。"
        : "将按登记开始时间到登记结束时间范围内的数据生成生产登记表。",
      okText: "确认",
      cancelText: "取消",
      async onOk() {
        try {
          const staffSignList = await staffSignFindByRegId(registrationId.value);
          const stationStaffNameMap = new Map<number, Set<string>>();
          for (const sign of Array.isArray(staffSignList) ? staffSignList : []) {
            const signInfo = sign as any;
            const stationId = Number(
              signInfo?.stationId ??
                signInfo?.virtualStationInfo?.stationId ??
                signInfo?.virtualStationInfo?.stationInfo?.id
            );
            const staffName = signInfo?.staffInfo?.staffName || signInfo?.staffName || "";
            if (!stationId || !staffName) continue;
            const names = stationStaffNameMap.get(stationId) || new Set<string>();
            names.add(staffName);
            stationStaffNameMap.set(stationId, names);
          }

          const sourceRecords = getBeatRecordsInDetailDay(allStationSignalList.value);
          // 节拍沿用正常有效节拍口径，与趋势中的平均节拍一致。
          const beatData = formatSignal2ChartData(sourceRecords);
          type DetailExportEntry = {
            date: string;
            stationId: number;
            virtualStationInfo: any;
            output: number;
            beatCount: number;
            beatSum: number;
            maxBeat: number;
            minBeat: number;
          };
          const stationDayMap = new Map<string, DetailExportEntry>();
          function getEntry(date: string, stationId: number, vInfo: any) {
            const key = `${date}:${stationId}`;
            let entry = stationDayMap.get(key);
            if (!entry) {
              entry = {
                date,
                stationId,
                virtualStationInfo: vInfo,
                output: 0,
                beatCount: 0,
                beatSum: 0,
                maxBeat: -Infinity,
                minBeat: Infinity,
              };
              stationDayMap.set(key, entry);
            } else if (!entry.virtualStationInfo && vInfo) {
              entry.virtualStationInfo = vInfo;
            }
            return entry;
          }
          for (const item of beatData.xyData as any[]) {
            const timestamp = Number(item?.second?.timestamp);
            const stationId = Number(item?.second?.stationId ?? item?.first?.stationId);
            const beat = Number(item.beatTime);
            // 前置信号仅用于计算首个节拍，不能成为区间外的明细。
            if (
              !stationId ||
              !Number.isFinite(timestamp) ||
              timestamp < range.startTimestamp ||
              timestamp >= range.endTimestamp
            )
              continue;
            if (item.beatTime == null || !Number.isFinite(beat) || beat < 0) continue;
            const entry = getEntry(dayjs(timestamp).format("YYYY-MM-DD"), stationId, item.virtualStationInfo);
            entry.beatCount += 1;
            entry.beatSum += beat;
            entry.maxBeat = Math.max(entry.maxBeat, beat);
            entry.minBeat = Math.min(entry.minBeat, beat);
          }

          // 产出复用顶部“岗位登记总产能”口径：error/warn 计入，超出上下限不计入。
          // 清空统计日期时，跨天登记按自然日拆成多行；选日期时仅导出所选日。
          for (
            let day = dayjs(range.startTimestamp).startOf("day");
            day.valueOf() < range.endTimestamp;
            day = day.add(1, "day")
          ) {
            const dayStart = Math.max(day.valueOf(), range.startTimestamp);
            const dayEnd = Math.min(day.add(1, "day").valueOf(), range.endTimestamp);
            const capacityData = formatSignalAllStationRegistrationCapacityData(allStationSignalList.value, {
              registrationStartTimestamp: dayStart,
              registrationEndTimestamp: dayEnd,
            });
            for (const item of capacityData.xyData as any[]) {
              const vInfo = item.virtualStationInfo;
              const stationId = Number(vInfo?.stationId ?? vInfo?.stationInfo?.id ?? item.stationId);
              const output = Number(item.totalCapacity);
              if (!stationId || !Number.isFinite(output) || output <= 0) continue;
              getEntry(day.format("YYYY-MM-DD"), stationId, vInfo).output = output;
            }
          }

          const entries = Array.from(stationDayMap.values()).sort((a, b) => {
            const dateOrder = a.date.localeCompare(b.date);
            if (dateOrder) return dateOrder;
            const aNo = a.virtualStationInfo?.stationInfo?.stationNo || String(a.stationId);
            const bNo = b.virtualStationInfo?.stationInfo?.stationNo || String(b.stationId);
            return aNo.localeCompare(bNo, "zh-CN", { numeric: true });
          });
          const staffNames = new Set<string>();
          stationStaffNameMap.forEach((names) => names.forEach((name) => staffNames.add(name)));
          const productInfo = rInfo.productInfo;
          const productName = productInfo?.productName
            ? `${productInfo.productNo ? `[${productInfo.productNo}]-` : ""}${productInfo.productName}`
            : "/";
          const taskNo = rInfo.taskInfo.taskNo || "/";
          const planProductNumber = rInfo.planProductNumber || "/";
          const actualQuantity =
            rInfo.actualQuantity ?? rInfo.actualProductionQty ?? rInfo.actualNum ?? rInfo.actualCount ?? "/";
          const beatProductNumber = rInfo.beatProductNumber || "/";

          // 使用数值型 Excel 日期，支持排序及日期筛选，避免 UTC 转换导致日期偏移。
          // eslint-disable-next-line no-inner-declarations
          function toExcelDate(value: any) {
            const date = dayjs(value).format("YYYY-MM-DD");
            return date;
            // if (!date.isValid()) return "/";
            // return (
            //   (Date.UTC(date.year(), date.month(), date.date(), date.hour(), date.minute(), date.second()) -
            //     Date.UTC(1899, 11, 30)) /
            //   86400000
            // );
          }
          const aoa: any[][] = [
            [
              "产线编号",
              lInfo.lineNo || "/",
              "关联车间",
              lInfo.workshopInfo?.workshopName || lInfo.workshopInfo?.workshopNo || "/",
              "生产产线",
              lInfo.lineName || "/",
              "生产产品",
              productName,
              "关联任务单号",
              taskNo,
              "登记计划生产数量",
              planProductNumber,
            ],
            [
              "开始时间",
              dayjs(rInfo.startDate).format("YYYY-MM-DD hh:mm:ss"),
              // toExcelDate(rInfo.startDate),
              "结束时间",
              rInfo.endDate ? dayjs(rInfo.endDate).format("YYYY-MM-DD hh:mm:ss") : "/",
              "员工到岗数",
              staffNames.size,
              "工序数量",
              virtualStationList.value.filter((item) => !item.isFilter).length,
              "实际生产",
              actualQuantity,
              "登记生产产出",
              beatProductNumber,
            ],
            ["工位产出明细信息", "", "", "", "", "", "", "", "", "", "", ""],
            [
              "日期",
              "",
              "工位编号",
              "",
              "工位名称",
              "",
              "工位关联员工",
              "工位登记生产产出",
              "平均节拍",
              "最大节拍",
              "最小节拍",
              "",
            ],
            ...entries.map((entry) => {
              const vInfo =
                entry.virtualStationInfo ||
                virtualStationList.value.find((item) => Number(item.stationId) === entry.stationId);
              const names = stationStaffNameMap.get(entry.stationId);
              return [
                toExcelDate(entry.date),
                "",
                vInfo?.stationInfo?.stationNo || "/",
                "",
                vInfo?.virtualStationName || "/",
                "",
                names?.size ? Array.from(names).join(",") : "/",
                entry.output,
                entry.beatCount ? Number((entry.beatSum / entry.beatCount).toFixed(2)) : "/",
                entry.beatCount ? entry.maxBeat : "/",
                entry.beatCount ? entry.minBeat : "/",
                "",
              ];
            }),
          ];

          const worksheet = XLSXStyle.utils.aoa_to_sheet(aoa);
          const border = {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          };
          for (let r = 0; r < aoa.length; r += 1) {
            for (let c = 0; c < 12; c += 1) {
              const address = XLSXStyle.utils.encode_cell({ r, c });
              const cell = worksheet[address] || (worksheet[address] = { t: "s", v: "" });
              cell.s = {
                font: { name: "宋体", sz: 11, color: { rgb: "000000" } },
                alignment: { horizontal: r < 2 ? "left" : "center", vertical: "center", wrapText: true },
                border,
              };
            }
          }
          worksheet.B2.z = "m/d/yy h:mm";
          worksheet.D2.z = "m/d/yy h:mm";
          for (let r = 4; r < aoa.length; r += 1) {
            worksheet[XLSXStyle.utils.encode_cell({ r, c: 0 })].z = "mm-dd-yy";
            for (const c of [8, 9, 10]) {
              const cell = worksheet[XLSXStyle.utils.encode_cell({ r, c })];
              if (cell && typeof cell.v === "number") {
                // 如果是整数，使用 "0"；如果包含小数，使用 "0.##"
                cell.z = Number.isInteger(cell.v) ? "0" : "0.##";
              }
            }
          }

          worksheet["!merges"] = [{ s: { r: 2, c: 0 }, e: { r: 2, c: 11 } }];
          // 每一行都与模板一致：日期 A:B、编号 C:D、名称 E:F、最小节拍 K:L。
          for (let r = 3; r < aoa.length; r += 1) {
            for (const c of [0, 2, 4, 10]) {
              worksheet["!merges"].push({ s: { r, c }, e: { r, c: c + 1 } });
              const left = worksheet[XLSXStyle.utils.encode_cell({ r, c })];
              const right = worksheet[XLSXStyle.utils.encode_cell({ r, c: c + 1 })];
              left.s = { ...left.s, border: { top: border.top, bottom: border.bottom, left: border.left } };
              right.s = { ...right.s, border: { top: border.top, bottom: border.bottom, right: border.right } };
            }
          }
          // 标题内部不画竖线，保留 A:L 合并区域的完整外框。
          for (let c = 0; c < 12; c += 1) {
            const cell = worksheet[XLSXStyle.utils.encode_cell({ r: 2, c })];
            cell.s = {
              ...cell.s,
              border: {
                top: border.top,
                bottom: border.bottom,
                ...(c === 0 ? { left: border.left } : {}),
                ...(c === 11 ? { right: border.right } : {}),
              },
            };
          }
          worksheet["!cols"] = [19.5, 17.125, 20.625, 19.75, 26.5, 12, 13.375, 49.5, 12.875, 18.625, 12.875, 5.375].map(
            (width) => ({ width })
          );
          worksheet["!rows"] = aoa.map((_, index) => ({ hpt: [53, 48, 37, 32][index] || 36 }));
          const workbook = XLSXStyle.utils.book_new();
          XLSXStyle.utils.book_append_sheet(workbook, worksheet, "Sheet1");
          const fileNameSuffix = detailAnalysisDate.value ? analysisDateText.value : rInfo.registrationNo;
          XLSXStyle.writeFile(workbook, `生产登记-${fileNameSuffix}.xlsx`);
        } catch (error) {
          console.error("生产登记导出失败", error);
          message.error("生产登记导出失败，请稍后重试");
        }
      },
    });
  }

  /** 清除全部图表 */
  async function clearAllChart() {
    clearRealtimeAggregateSchedule();
    clearSignalIndexes();

    lineCapacityTopRange.value = null;

    stationBeatChartData.xyData = [];
    stationBeatChartData.xData = [];
    stationBeatChartData.yData = [];
    stationBeatChartData.todayRecordsTotal = 0;
    stationBeatChartData2.xData = [];
    stationBeatChartData2.yData = [];
    stationBeatChartData3.xData = [];
    stationBeatChartData3.yData = [];
    stationBeatChartData3.abnormalYData = [];
    stationBeatChartData3.xyData = [];
    lineBeatChartData.xyData = [];
    lineBeatChartData.xData = [];
    lineBeatChartData.yData = [];
    lineBeatChartData.maxLabel = "";
    lineBeatChartData.maxStationId = null;

    allStationBeatChartData.xyData = [];
    allStationBeatChartData.xData = [];
    allStationBeatChartData.yData = [];
    allStationBeatChartData.highlightMaxBeat = true;
    allStationBeatRankRaw.value = [];
    allStationHourlyCapacityRankRaw.value = [];
    allStationRegistrationCapacityRaw.value = [];
    allStationSignalList.value = [];
    todayAllStationSignalList.value = [];
    hourlyCapacityDrilldownRange.value = null;
    lastExceptionQueryKey.value = "";

    lineBalanceChartData.xyData = [];
    lineBalanceChartData.xData = [];
    lineBalanceChartData.yData = [];

    lineHourlyCapacityChartData.xyData = [];
    lineHourlyCapacityChartData.xData = [];
    lineHourlyCapacityChartData.yData = [];
    lineHourlyCapacityChartData.markLineValue = 0;

    currentDate.value = "";
  }

  /** 渲染全部图表：仅初始化、切登记/日期等完整场景调用。 */
  const LINE_RATE_BACKFILL_PAGE_SIZE = 1000;
  const lineRateBackfillState = reactive({
    running: false,
    current: 0,
    total: 0,
  });

  function isMissingLineRate(value: unknown) {
    return value === null || value === undefined || value === "";
  }

  function calculateRegistrationLineRate(yData: unknown[]) {
    const values = (yData || []).map(Number).filter((value) => Number.isFinite(value));
    if (!values.length) return null;

    const sum = values.reduce((total, value) => total + value, 0);
    console.log(sum, values.length);
    console.log({
      lineRate: (sum / values.length).toFixed(2),
      lineMaxRate: Math.max(...values).toFixed(2),
      lineMinRate: Math.min(...values).toFixed(2),
    });

    return {
      lineRate: (sum / values.length).toFixed(2),
      lineMaxRate: Math.max(...values).toFixed(2),
      lineMinRate: Math.min(...values).toFixed(2),
    };
  }

  async function getRegistrationLineRate(record: any) {
    const lineId = Number(record?.lineId ?? record?.lineInfo?.id);
    const startDate = record?.startDate;
    const endDate = record?.endDate;

    if (!lineId || !startDate || !endDate) return null;

    const lineType = record?.lineInfo?.lineType ?? record?.lineType;
    const pdxLine = isPDXLine(lineType);
    let records = await signalSpecifyDateData({
      type: pdxLine ? SubModuleType.SCALE : SubModuleType.GENERAL_INPUT,
      lineId,
      startDate,
      endDate,
    });

    if (pdxLine) {
      records = transformScale2General(startDate, endDate, records || [], true);
    }

    const { yData } = formatBalanceListChartData(records || []);
    return calculateRegistrationLineRate(yData);
  }

  /**
   * 一次性补全历史登记线平衡数据。
   *
   * - registrationList 每页请求 1000 条，并自动继续后续页；
   * - 仅补任一字段为空的已结束登记，已有三个字段的数据不会覆盖；
   * - 单条失败不会中断整批，最终返回汇总结果。
   *
   * 补数完成并确认数据正确后，可以删除该方法和页面上的临时按钮。
   */
  async function completeRegistrationLineRateOnce() {
    if (lineRateBackfillState.running) return;

    lineRateBackfillState.running = true;
    lineRateBackfillState.current = 0;
    lineRateBackfillState.total = 0;

    let pageNum = 1;
    let success = 0;
    let skipped = 0;
    let noData = 0;
    const failed: Array<{ id: number; registrationNo?: string; error: unknown }> = [];

    try {
      while (true) {
        const result = await registrationList({
          pageNum,
          pageSize: LINE_RATE_BACKFILL_PAGE_SIZE,
          sort: "id asc",
        });
        const records = result?.records || [];
        const total = Number(result?.total) || 0;

        if (pageNum === 1) {
          lineRateBackfillState.total = total || records.length;
        }

        for (const record of records) {
          lineRateBackfillState.current += 1;

          const needsBackfill =
            isMissingLineRate(record.lineRate) ||
            isMissingLineRate(record.lineMaxRate) ||
            isMissingLineRate(record.lineMinRate);

          if (!needsBackfill || !record.startDate || !record.endDate) {
            skipped += 1;
            continue;
          }

          try {
            const lineRateData = await getRegistrationLineRate(record);
            if (!lineRateData) {
              noData += 1;
              continue;
            }
            console.log({
              id: record.id,
              lineRate: isMissingLineRate(record.lineRate) ? lineRateData.lineRate : record.lineRate,
              lineMaxRate: isMissingLineRate(record.lineMaxRate) ? lineRateData.lineMaxRate : record.lineMaxRate,
              lineMinRate: isMissingLineRate(record.lineMinRate) ? lineRateData.lineMinRate : record.lineMinRate,
            });

            await registrationEdit({
              id: record.id,
              lineRate: isMissingLineRate(record.lineRate) ? lineRateData.lineRate : record.lineRate,
              lineMaxRate: isMissingLineRate(record.lineMaxRate) ? lineRateData.lineMaxRate : record.lineMaxRate,
              lineMinRate: isMissingLineRate(record.lineMinRate) ? lineRateData.lineMinRate : record.lineMinRate,
            });
            success += 1;
          } catch (error) {
            failed.push({
              id: record.id,
              registrationNo: record.registrationNo,
              error,
            });
            console.error("补全登记线平衡失败", record.id, record.registrationNo, error);
          }
        }

        const reachedTotal = total > 0 && pageNum * LINE_RATE_BACKFILL_PAGE_SIZE >= total;
        if (!records.length || records.length < LINE_RATE_BACKFILL_PAGE_SIZE || reachedTotal) {
          break;
        }
        pageNum += 1;
      }

      const summary = `补全完成：成功 ${success} 条，无线平衡数据 ${noData} 条，跳过 ${skipped} 条，失败 ${failed.length} 条`;
      if (failed.length) {
        message.warning(summary);
        console.table(
          failed.map((item) => ({
            id: item.id,
            registrationNo: item.registrationNo,
            error: item.error instanceof Error ? item.error.message : String(item.error),
          }))
        );
      } else {
        message.success(summary);
      }

      return { success, skipped, noData, failed };
    } catch (error) {
      console.error("批量补全登记线平衡失败", error);
      message.error("批量补全失败，请查看控制台错误信息");
      throw error;
    } finally {
      lineRateBackfillState.running = false;
    }
  }

  function handleCompleteRegistrationLineRate() {
    Modal.confirm({
      title: "确认一次性补全登记线平衡？",
      content:
        "将以每页 1000 条读取全部登记，只更新 lineRate、lineMaxRate、lineMinRate 任一为空且已经结束的登记。执行时间可能较长，请勿关闭页面。",
      okText: "开始补全",
      cancelText: "取消",
      async onOk() {
        await completeRegistrationLineRateOnce();
      },
    });
  }

  async function renderAllChart() {
    if (selectedHourTrendRange.value) {
      renderLineBeatBySelectedHours();
    }

    await toRenderAllStationBeatData();
    await toRenderStationBeatData();
    await toRenderLineBalanceBeatData();

    lastRealtimeRankRenderAt = Date.now();
    lastRealtimeSummaryRenderAt = Date.now();

    const rInfo = registrationInfo.value;
    if (
      rInfo?.startDate &&
      rInfo?.endDate &&
      (isMissingLineRate(rInfo.lineRate) ||
        isMissingLineRate(rInfo.lineMaxRate) ||
        isMissingLineRate(rInfo.lineMinRate))
    ) {
      const lineRateData = calculateRegistrationLineRate(lineBalanceChartData.yData);
      if (lineRateData) {
        await registrationEdit({
          id: rInfo.id,
          lineRate: lineRateData.lineRate,
          lineMaxRate: lineRateData.lineMaxRate,
          lineMinRate: lineRateData.lineMinRate,
        });
      }
    }
  }

  /** 岗位统计-是否是慢速岗位 */
  function isAverageDanger(index: number) {
    const { pageNo } = stationRankData;
    if (pageNo === 1 && index < 3) {
      return true;
    }
  }
  // const lastName = ref();
  /** 线体节拍 x轴点击 */
  async function handleLineChartClick(params: any) {
    const componentType = params?.componentType;
    if (componentType !== "xAxis" && componentType !== "series") return;

    const info = getStationChartClickInfo(params, lineBeatChartData);
    const virtualStationId = info?.virtualStationInfo?.id;
    if (!virtualStationId) return;

    lastData = 0;
    isFisrt.value = true;
    selectVirtualStationId.value = virtualStationId;
    // 当前岗位的趋势和异常累计统一刷新。
    await toRenderStationBeatData();
  }

  /**
   * 从被点击图表自己的数据源解析岗位，不受下方图表模式影响。
   *
   * 优先用岗位文字匹配，可避免 dataZoom / xAxis 点击时 dataIndex 偶发错位；
   * 找不到文字时才回退到 dataIndex。
   */
  function getStationChartClickInfo(params: any, chartData: { xData: any[]; xyData: any[] }) {
    const componentType = params?.componentType;
    const clickedLabel =
      componentType === "xAxis" ? params?.value : componentType === "series" ? params?.name : undefined;

    if (clickedLabel !== undefined && clickedLabel !== null) {
      const labelIndex = chartData.xData.findIndex((item: any) => String(item) === String(clickedLabel));

      if (labelIndex >= 0) {
        return chartData.xyData?.[labelIndex];
      }
    }

    const dataIndex = Number(params?.dataIndex);
    if (Number.isInteger(dataIndex) && dataIndex >= 0) {
      return chartData.xyData?.[dataIndex];
    }

    return undefined;
  }

  /** 点击顶部岗位图，切换下方当前岗位。 */
  async function handleStationRankChartClick(params: any) {
    const componentType = params?.componentType;

    // 支持点岗位名称，也支持直接点柱子。
    if (componentType !== "xAxis" && componentType !== "series") {
      return;
    }

    // 平均节拍、小时产能排行及登记详情都使用当前顶部图的数据。
    const info = getStationChartClickInfo(params, allStationBeatChartData);
    const virtualStationId = info?.virtualStationInfo?.id;

    if (!virtualStationId) {
      message.warning("当前岗位没有有效的工位信息");
      return;
    }

    lastData = 0;
    isFisrt.value = true;
    selectVirtualStationId.value = virtualStationId;

    if (props.detailView) {
      // 详情页切岗位时保留正在查看的小时钻取范围。
      isHourRank.value = false;
    } else if (chartType.value === "hour") {
      hourlyCapacityDrilldownRange.value = null;
      isHourRank.value = false;
      applyStationRankChartData();
    }

    await toRenderStationBeatData();
  }

  async function handleStationChartClick(params: any) {
    const { componentType, dataIndex } = params;

    if (componentType === "series") {
      const info = stationBeatChartData.xyData[dataIndex];
      const messageId = info?.second?.messageId;

      if (!messageId) {
        message.warning("当前岗位暂无关联视频");
        return;
      }

      try {
        const endDate = registrationInfo.value?.endDate
          ? registrationInfo.value.endDate
          : dayjs().format("YYYY-MM-DD HH:mm:ss");
        const res = await getVideoStorageAddress({
          messageId,
          startDate: registrationInfo.value?.startDate as string,
          endDate,
        });
        const videoStorageAddress = res?.videoStorageAddress;
        const videoUrl = buildWebDavVideoUrl(videoStorageAddress);

        if (!videoUrl) {
          message.warning("当前节拍没有关联视频");
          return;
        }
        window.open(videoUrl, "_blank");
        // 使用独立弹窗播放，避免跳出当前分析页面。
        // madalData.value.videoUrl = videoUrl;
        // madalData.value.visible = true;
      } catch (error) {
        console.error("获取岗位节拍视频失败:", error);
        message.error("获取岗位节拍视频失败");
      }
    }
  }

  /** 点击标准小时产能柱，切换到该柱实际统计时间段的岗位节拍趋势。 */
  /**
   * 按当前登记/统计日默认范围恢复详情顶部岗位总产能。
   */
  function restoreDetailTopRegistrationCapacity() {
    if (!props.detailView) return;
    lineCapacityTopRange.value = null;

    const rInfo = registrationInfo.value || props.info;
    const detailRange = detailAnalysisDayRange.value;

    const startTimestamp =
      detailRange?.startTimestamp ?? (rInfo?.startDate ? dayjs(rInfo.startDate).valueOf() : undefined);

    const endTimestamp =
      detailRange?.endTimestamp ??
      (rInfo?.endDate ? dayjs(rInfo.endDate).valueOf() : getDetailRegistrationEffectiveEndTimestamp());

    const data = formatSignalAllStationRegistrationCapacityData(allStationSignalList.value, {
      registrationStartTimestamp: startTimestamp,
      registrationEndTimestamp: endTimestamp,
    });

    allStationRegistrationCapacityRaw.value = data.xyData;
    applyStationRankChartData();
  }

  /** 手动取消产线标准小时产能与顶部岗位总产能的时段联动。 */
  function handleCancelLineCapacityTopRange() {
    chartType.value = "hour";

    restoreDetailTopRegistrationCapacity();
  }

  /**
   * 右侧汇总图切换。
   * 详情页从“产线标准小时产能”切回“线平衡”时，
   * 同时恢复顶部默认岗位总产能范围。
   */
  function handleLineSummaryChartTypeChange(type: "balance" | "capacity") {
    lineSummaryChartType.value = type;

    if (props.detailView && type === "balance" && lineCapacityTopRange.value) {
      restoreDetailTopRegistrationCapacity();
    }
  }

  /**
   * 详情页点击“产线标准小时产能”某个小时：
   * 顶部岗位总产能同步切换到该小时实际统计区间。
   */
  async function handleLineHourlyCapacityChartClick(params: any) {
    if (props.detailView) {
      const componentType = params?.componentType;
      if (componentType !== "series" && componentType !== "xAxis") {
        return;
      }

      let dataIndex = Number(params?.dataIndex);

      // xAxis 点击时优先按 label 找，避免 dataZoom 后索引偶发错位。
      if (componentType === "xAxis" && params?.value != null) {
        const matchedIndex = lineHourlyCapacityChartData.xData.findIndex(
          (item: any) => String(item) === String(params.value)
        );

        if (matchedIndex >= 0) {
          dataIndex = matchedIndex;
        }
      }

      const item = lineHourlyCapacityChartData.xyData?.[dataIndex];
      const startTimestamp = Number(item?.startTimestamp);
      const endTimestamp = Number(item?.endTimestamp);

      if (!Number.isFinite(startTimestamp) || !Number.isFinite(endTimestamp) || endTimestamp <= startTimestamp) {
        message.warning("当前产线标准小时产能没有有效统计时间段");
        return;
      }

      lineCapacityTopRange.value = {
        label: item.label,
        startTimestamp,
        endTimestamp,
      };

      const data = formatSignalAllStationRegistrationCapacityData(allStationSignalList.value, {
        registrationStartTimestamp: startTimestamp,
        registrationEndTimestamp: endTimestamp,
      });

      hourlyCapacityDrilldownRange.value = {
        label: item.label,
        startTimestamp,
        endTimestamp,
      };
      chartType.value = "normal";
      await toRenderStationBeatData();
      allStationRegistrationCapacityRaw.value = data.xyData;
      applyStationRankChartData();
    } else {
      if (topChartType.value !== "rank") {
        handleTopChartTypeChange("rank");
      }
      const data = [
        dayjs(lineHourlyCapacityChartData.xyData[params.dataIndex].startTimestamp),
        dayjs(lineHourlyCapacityChartData.xyData[params.dataIndex].endTimestamp),
      ];
      handleTimeRangeChange(data);
      chartType.value = "normal";
    }
  }

  async function handleHourlyCapacityChartClick(params: any) {
    const componentType = params?.componentType;
    if (componentType !== "series" && componentType !== "xAxis") return;

    let dataIndex = Number(params?.dataIndex);

    // 点击横轴文字时按时段 label 反查，避免 dataZoom 后索引错位。
    if (componentType === "xAxis" && params?.value != null) {
      const matchedIndex = stationBeatChartData3.xData.findIndex((item: any) => String(item) === String(params.value));

      if (matchedIndex >= 0) {
        dataIndex = matchedIndex;
      }
    }

    const info = stationBeatChartData3.xyData?.[dataIndex];
    const startTimestamp = Number(info?.startTimestamp);
    const endTimestamp = Number(info?.endTimestamp);

    if (!Number.isFinite(startTimestamp) || !Number.isFinite(endTimestamp) || endTimestamp <= startTimestamp) {
      message.warning("当前标准小时产能没有有效的节拍时间段");
      return;
    }

    // 仅钻取左下角当前岗位的节拍趋势，不改顶部时间筛选，也不重算其他图表。
    hourlyCapacityDrilldownRange.value = {
      label: info.label,
      startTimestamp,
      endTimestamp,
    };
    chartType.value = "normal";
    await toRenderStationBeatData();
  }

  /** 从标准小时产能钻取的节拍趋势返回标准小时产能图。 */
  async function handleBackToHourlyCapacity() {
    hourlyCapacityDrilldownRange.value = null;
    chartType.value = "hour";
    await toRenderStationBeatData();
  }

  async function runLineBeatPollingOnce() {
    if (lineBeatRequesting || document.hidden) return;

    lineBeatRequesting = true;
    try {
      await toRenderLineBeatData();
    } finally {
      lineBeatRequesting = false;
    }
  }

  /** 打开实时数据轮询 */
  async function openLineDataInterval() {
    // 请求一次
    await runLineBeatPollingOnce();

    // 开始轮询；上一轮未结束时直接跳过，避免慢请求叠加。
    clearInterval(lineBeatChartData.timer);
    lineBeatChartData.timer = setInterval(() => {
      void runLineBeatPollingOnce();
    }, lineBeatChartData.delay);
  }

  /** 关闭实时数据轮询 */
  function closeLineDataInterval() {
    clearInterval(lineBeatChartData.timer);
    clearRealtimeAggregateSchedule();
  }

  /** 获取 图表1标题 */
  function _getData1Title() {
    const info = lineInfo.value;

    if (info) {
      return `【${info.lineName}】- 实时节拍`;
    } else {
      return "";
    }
  }
  const analysisDay = computed(() => {
    if (!props.detailView) return dayjs();

    const rInfo = getDetailRegistrationInfo();
    return dayjs(detailAnalysisDate.value || rInfo?.startDate || Date.now()).startOf("day");
  });

  const analysisDateText = computed(() => {
    if (!props.detailView) {
      return analysisDay.value.format("YYYY-MM-DD");
    }

    if (detailAnalysisDate.value) {
      return detailAnalysisDate.value;
    }

    const rInfo = getDetailRegistrationInfo();
    if (!rInfo?.startDate) return "";

    const startText = dayjs(rInfo.startDate).format("YYYY-MM-DD");
    const endText = dayjs(getDetailRegistrationEffectiveEndTimestamp()).format("YYYY-MM-DD");

    return startText === endText ? startText : `${startText}~${endText}`;
  });

  /**
   * 普通数据分析页以当前时间为准；生产登记详情若为历史登记，则以登记结束时间作为“当前时刻”，
   * 这样标准小时产能、标题和自然日分桶都落在该登记所属日期，而不是今天。
   */
  function getAnalysisNowTimestamp() {
    if (!props.detailView) return Date.now();

    const range = detailAnalysisDayRange.value;
    return range?.endTimestamp ?? Date.now();
  }
  /**
   * 岗位节拍趋势的时间范围：
   * 1. 点击标准小时产能柱：使用该小时实际统计范围；
   * 2. 用户手动时间筛选：使用手动筛选范围；
   * 3. 默认状态：返回 null，由岗位趋势使用“最近 1 小时”。
   *
   * 注意：selectedHourTrendRange 在页面初始化时可能被设置为整条登记范围，
   * 但这只是页面默认统计范围，不应该覆盖岗位趋势原来的最近 1 小时行为。
   */
  function getStationTrendSelectedRange() {
    if (hourlyCapacityDrilldownRange.value) {
      return hourlyCapacityDrilldownRange.value;
    }

    if (isCustomTimeRange.value && selectedHourTrendRange.value) {
      return selectedHourTrendRange.value;
    }

    return null;
  }

  /** 获取 图表2标题 */
  function _getData2Title() {
    const vid = selectVirtualStationId.value;
    const vInfo = selectVirtualStationInfo.value;
    const sd = analysisDateText.value;
    let stationText = "";

    if (vid && vInfo) {
      const {
        virtualStationName,
        stationInfo: { stationNo },
      } = vInfo;

      stationText = `${stationNo}-${virtualStationName}`;
    } else {
      stationText = "";
    }
    const stationTrendRange = getStationTrendSelectedRange();

    // 默认最近 1 小时时，不再把整条登记时间误显示在标题里。
    const hourLabel = stationTrendRange?.label;

    return `【${stationText}】- ${sd}${hourLabel ? ` ${hourLabel}` : ""} 节拍趋势`;
  }
  function _getData5Title() {
    const vid = selectVirtualStationId.value;
    const vInfo = selectVirtualStationInfo.value;
    const sd = analysisDateText.value;

    let stationText = "";

    if (vid && vInfo) {
      const {
        virtualStationName,
        stationInfo: { stationNo },
      } = vInfo;

      stationText = `${stationNo}-${virtualStationName}`;
    }

    return `【${stationText}】- ${sd} 统计图`;
  }

  /** 获取岗位小时图标题 */
  function _getHourCapacityTitle() {
    const vid = selectVirtualStationId.value;
    const vInfo = selectVirtualStationInfo.value;
    let stationText = "";

    if (vid && vInfo) {
      const {
        virtualStationName,
        stationInfo: { stationNo },
      } = vInfo;

      stationText = `${stationNo}-${virtualStationName}`;
    }

    const chartName = props.detailView ? "工单小时产能" : "小时产能";
    return `【${stationText}】- ${analysisDateText.value} ${chartName}`;
  }

  /** 生产登记详情：岗位总产能标题 */
  function _getRegistrationCapacityTitle() {
    const info = lineInfo.value;
    const rInfo = registrationInfo.value || props.info;
    if (!info) return "";

    const registrationNo = rInfo?.registrationNo ? ` ${rInfo.registrationNo}` : "";
    const drillRange = lineCapacityTopRange.value;

    if (drillRange) {
      const startText = dayjs(drillRange.startTimestamp).format("YYYY-MM-DD HH:mm");
      const endText = dayjs(drillRange.endTimestamp).format(
        dayjs(drillRange.startTimestamp).isSame(dayjs(drillRange.endTimestamp), "day") ? "HH:mm" : "YYYY-MM-DD HH:mm"
      );

      return `【${info.lineName}】${registrationNo} ${startText}-${endText}-时段岗位总产能`;
    }

    const capacityTitle = detailAnalysisDate.value ? "当天岗位总产能" : "岗位登记总产能";

    return `【${info.lineName}】${registrationNo} ${analysisDateText.value}-${capacityTitle}`;
  }

  /** 获取右侧岗位排行标题 */
  function _getData3Title() {
    const info = lineInfo.value;
    const sd = analysisDateText.value;

    if (!info) return "";

    const rankTitle = isHourRank.value ? "平均标准小时产能排行" : "岗位平均节拍" + showTime.value;
    return `【${info.lineName}】${sd}-${rankTitle}`;
  }

  /** 获取产线小时图标题 */
  function _getLineHourlyCapacityTitle() {
    const info = lineInfo.value;
    if (!info) return "";

    return `【${info.lineName}】- ${props.detailView ? "工单平均小时产能" : "产线平均小时产能"}`;
  }

  /** 获取 图表4标题 */
  function _getData4Title() {
    const info = lineInfo.value;
    const sd = analysisDateText.value;
    if (info) {
      const balanceTitle = props.detailView && !detailAnalysisDate.value ? "登记线平衡" : "线平衡";
      return `【${info.lineName}】${sd}-${balanceTitle}`;
    } else {
      return "";
    }
  }

  /** 渲染产线实时节拍 */
  async function toRenderLineBeatData() {
    const lid = lineId.value!!;
    const rInfo = registrationInfo.value!!;
    const isPDX = isPDXLine(lineInfo.value?.lineType);
    const date = formatDateByDayjs(Date.now(), "YYYY-MM-DD HH:mm:ss");
    currentDate.value = date;

    // 开始时间不能小于登记时间
    const regStartDate = new Date(registrationInfo.value?.startDate!!);

    let records: SignalDataInfo[] = [];
    const recordStartDate = Math.max(regStartDate.getTime(), Date.now() - lineBeatBaseDouble.value * 1000);
    // 实时轮询只拉最近几个节拍范围，不能每次从当天 00:00:00 开始请求。
    const startDate = formatDateByDayjs(recordStartDate, "YYYY-MM-DD HH:mm:ss");
    const endDate = formatRegistrationEndDate(rInfo);

    if (isPDX) {
      // 皮带线 按需取信号 二次尝试！！
      records = await signalSpecifyDateData({
        type: SubModuleType.SCALE,
        lineId: lid,
        startDate,
        endDate,
      });

      // ★ 加入重量信号转通用输入逻辑
      records = transformScale2General(startDate, endDate, records, false);
    } else {
      // console.log(selectVirtualStationInfo.value?.stationId);

      // 请求指定时间内的节拍数据
      records = await signalSpecifyDateData({
        type: SubModuleType.GENERAL_INPUT,
        lineId: lid,
        startDate,
        endDate,
        count: lineBeatCount,
      });
    }

    // 调试用
    // const records = [
    //   {
    //     "timestamp": 1709792195071,
    //     "lineId": 8,
    //     "stationId": 17,
    //     "staffId": 12,
    //     "addon": null,
    //     "approachWristband": null,
    //     "deviceGround": null,
    //     "generalInput": "1",
    //   },
    //   {
    //     "timestamp": 1709792201614,
    //     "lineId": 8,
    //     "stationId": 17,
    //     "staffId": 12,
    //     "addon": null,
    //     "approachWristband": null,
    //     "deviceGround": null,
    //     "generalInput": "1",
    //   },
    // ] as any[];

    // 渲染实时节拍图表
    // console.log("recordsrecords", records);
    const realtimeRecords = selectedHourTrendRange.value
      ? getBeatRecordsInSelectedHours(allStationSignalList.value)
      : records;
    const { xyData, xData, yData, markLineValue } = formatSignalStationsRealTimeChartData(realtimeRecords);

    lineBeatChartData.xyData = xyData;
    lineBeatChartData.xData = xData;
    lineBeatChartData.yData = yData;
    lineBeatChartData.markLineValue = markLineValue;

    if (records.length > 0) {
      const changedRecords = composeSignalList(records);

      if (changedRecords.length) {
        /**
         * 当前选中岗位有新增或更新信号时，立即刷新左下岗位图；
         * 其它全线统计交给分层调度器，避免每条信号触发整页重算。
         */
        const selectedStationId = selectVirtualStationInfo.value?.stationId;

        if (selectedStationId != null && changedRecords.some((item) => item.stationId === selectedStationId)) {
          await toRenderStationBeatData();
        }

        scheduleRealtimeAggregateRender();
      }
    }
  }

  /** 渲染实时节拍工位列表 */
  function renderRealTimeStationList() {
    // 渲染实时节拍图表
    const { xyData, xData, yData, markLineValue } = formatSignalStationsRealTimeChartData([]);

    lineBeatChartData.xyData = xyData;
    lineBeatChartData.xData = xData;
    lineBeatChartData.yData = yData;
  }

  /** 合并实时信号到当天缓存，返回真正新增或字段发生变化的记录。 */
  function composeSignalList(records: SignalDataInfo[]) {
    if (props.detailView && detailAnalysisDate.value && !dayjs(detailAnalysisDate.value).isSame(dayjs(), "day")) {
      return [] as SignalDataInfo[];
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();

    const validRecords: SignalDataInfo[] = [];

    for (const signal of records) {
      if (signal.timestamp < todayStart || signal.timestamp >= tomorrowStart) {
        continue;
      }
      validRecords.push(signal);
    }

    if (!validRecords.length) {
      return validRecords;
    }

    const { appendedRecords, changedRecords } = upsertSignalIndexes(validRecords);

    /**
     * shallowRef 内部数组允许原地追加：
     * 已存在的记录由 upsertSignalIndexes 通过 Object.assign 原位更新；
     * 后续图表都是业务函数主动重算，不依赖深层 watcher，
     * 因此不再每 2 秒 [...oldList, ...newList] + slice() 两次复制全天数据。
     */
    if (appendedRecords.length) {
      const todayList = todayAllStationSignalList.value;
      todayList.push(...appendedRecords);

      if (allStationSignalList.value !== todayList) {
        allStationSignalList.value.push(...appendedRecords);
      }
    }

    return changedRecords;
  }

  /**
   * 异常写入前重新确认当前产线的最新登记及对应工位。
   * 页面长时间未刷新时，禁止继续使用缓存中的旧登记 ID、旧虚拟工位 ID。
   */
  async function getLatestBeatExceptionContext() {
    const currentRegistration = registrationInfo.value;
    const currentVirtualStation = selectVirtualStationInfo.value;
    const currentLineId = Number(lineId.value ?? currentRegistration?.lineId);
    const currentStationId = Number(currentVirtualStation?.stationId ?? currentVirtualStation?.stationInfo?.id);

    if (!currentLineId || !currentStationId) return null;

    const latestRegistration = await registrationDetailGetByLatest(currentLineId);
    if (
      !latestRegistration?.id ||
      latestRegistration.registrationStatus !== RegistrationStatus.IN_REGISTRATION ||
      !latestRegistration.virtualLineId
    ) {
      return null;
    }

    let latestVirtualLine = virtualLineInfo.value;
    if (String(latestVirtualLine?.id) !== String(latestRegistration.virtualLineId)) {
      latestVirtualLine = await virtualLineDetail(latestRegistration.virtualLineId);
    }

    const latestVirtualStationList = [...(latestVirtualLine?.virtualStationList || [])].sort(
      (a: any, b: any) => Number(a.virtualStationSort || 0) - Number(b.virtualStationSort || 0)
    );
    const currentStationNo = currentVirtualStation?.stationInfo?.stationNo;
    const latestStaffSignList = latestRegistration.staffSignList || [];
    const latestStaffSign = latestStaffSignList.find((item: any) => {
      const itemStationId = Number(
        item?.stationId ?? item?.virtualStationInfo?.stationId ?? item?.virtualStationInfo?.stationInfo?.id
      );
      return itemStationId === currentStationId;
    });

    // 最新登记明确带有工位登记列表时，当前物理工位必须也在新登记中。
    if (latestStaffSignList.length && !latestStaffSign) return null;

    const signedVirtualStationId = Number(latestStaffSign?.virtualStationId ?? latestStaffSign?.virtualStationInfo?.id);
    const latestVirtualStation = latestVirtualStationList.find((item: any) => {
      if (signedVirtualStationId && Number(item?.id) === signedVirtualStationId) return true;

      const itemStationId = Number(item?.stationId ?? item?.stationInfo?.id);
      if (itemStationId === currentStationId) return true;

      return currentStationNo && String(item?.stationInfo?.stationNo || "") === String(currentStationNo);
    });

    // 新登记中不存在当前物理工位时不写异常，避免绑定到错误工位。
    if (!latestVirtualStation?.id) return null;

    // 同步共享状态，后续轮询和图表使用最新登记、最新虚拟产线及工位。
    registrationId.value = latestRegistration.id;
    registrationInfo.value = latestRegistration;
    virtualLineInfo.value = latestVirtualLine;
    virtualStationList.value = latestVirtualStationList;
    selectVirtualStationId.value = latestVirtualStation.id;
    selectVirtualStationInfo.value = latestVirtualStation;

    return {
      registrationInfo: latestRegistration,
      virtualLineInfo: latestVirtualLine,
      virtualStationInfo: latestVirtualStation,
    };
  }

  /** 渲染工位节拍趋势
   *
   * 当天信号只在初始化时请求一次，后续实时轮询只往本地列表追加增量。
   * 岗位趋势、分布图、标准小时产能都直接从当天本地数据计算，不再为当前岗位额外发请求。
   */
  async function toRenderStationBeatData() {
    // 当前岗位被过滤或尚未选择时，默认选择第一个未过滤岗位。
    const availableVirtualStations = virtualStationList.value.filter(
      (item) => !item.isFilter && !stationStore.stationList.includes(item.id)
    );
    let vsInfo = availableVirtualStations.find((item) => item.id === selectVirtualStationId.value);
    if (!vsInfo) {
      vsInfo = availableVirtualStations[0];
    }

    if (!vsInfo) {
      stationBeatChartData.xyData = [];
      stationBeatChartData.xData = [];
      stationBeatChartData.yData = [];
      stationBeatChartData.average = 0;
      stationBeatChartData.todayRecordsTotal = 0;
      stationBeatChartData2.xData = [];
      stationBeatChartData2.yData = [];
      stationBeatChartData3.xData = [];
      stationBeatChartData3.yData = [];
      stationBeatChartData3.abnormalYData = [];
      stationBeatChartData3.xyData = [];
      return;
    }

    const { id: virtualStationId, stationId } = vsInfo;
    selectVirtualStationId.value = virtualStationId;
    selectVirtualStationInfo.value = vsInfo;

    /**
     * 当前岗位信号直接从 stationSignalMap 获取。
     * 原逻辑每次刷新都会对全线全天数据 filter 一遍。
     */
    const indexedStationRecords = stationSignalMap.get(stationId) || [];

    const stationSignalList = props.detailView
      ? getBeatRecordsInDetailDay(indexedStationRecords)
      : indexedStationRecords;

    /**
     * “当天累计次数”单独使用当前岗位完整的当天/统计日数据计算。
     * 不能使用下面只保留最近 1 小时的 visibleBeatData。
     *
     * 异常点开关的统计口径与趋势保持一致：
     * - 关闭异常点：只统计正常有效节拍；
     * - 开启异常点：异常节拍也一起计入。
     */
    const stationDayChartData = formatSignal2ChartData(stationSignalList, {
      includeAbnormalPoints: checked.value,
    });
    const stationTodayRecordsTotal = stationDayChartData.xyData.length;

    // 默认显示最近 1 小时；点击“标准小时产能”柱后，改为显示该柱实际参与产能统计的时间窗口。
    // 多保留窗口开始前最后一条信号，用于正确计算跨入窗口后的第一个节拍；
    // 最终按 second.timestamp 做 [start, end) 过滤，保证趋势与标准小时产能统计窗口一致。
    const nowTimestamp = getAnalysisNowTimestamp();
    const defaultTrendStartTimestamp = nowTimestamp - 60 * 60 * 1000;
    const selectedTrendRange = getStationTrendSelectedRange();

    // 默认最近 1 小时；
    // 只有点击标准小时产能柱或用户主动修改时间筛选后，才覆盖这个默认范围。
    const trendStartTimestamp = selectedTrendRange?.startTimestamp ?? defaultTrendStartTimestamp;
    const trendEndTimestamp = selectedTrendRange?.endTimestamp ?? nowTimestamp;
    const sortedStationSignalList = [...stationSignalList].sort((a, b) => a.timestamp - b.timestamp);
    const firstTrendIndex = sortedStationSignalList.findIndex((item) => item.timestamp >= trendStartTimestamp);
    const trendSourceList =
      firstTrendIndex > 0
        ? sortedStationSignalList.slice(firstTrendIndex - 1)
        : firstTrendIndex === 0
        ? sortedStationSignalList
        : [];
    const trendChartData = formatSignal2ChartData(trendSourceList, {
      includeAbnormalPoints: checked.value,
    });
    const visibleBeatData = trendChartData.xyData.filter((item: any) => {
      const timestamp = item?.second?.timestamp;
      return timestamp >= trendStartTimestamp && timestamp < trendEndTimestamp;
    });
    const xData = visibleBeatData.map((item: any) => `${item.secondDate.slice(-8)}`);

    // 纯数字 yData 继续用于平均值、分布统计等原有业务逻辑。
    const yData = visibleBeatData.map((item: any) => item.beatTime);

    // 异常点只负责标红；异常说明统一放到 tooltip 里显示。
    const chartYData = visibleBeatData.map((item: any) =>
      checked.value && item.isAbnormal
        ? {
            value: item.beatTime,
            symbol: "circle",
            symbolSize: 8,
            itemStyle: { color: "#ff4d4f" },
          }
        : item.beatTime
    );

    const xyData = visibleBeatData;
    const markLineValue = yData.length
      ? (yData.reduce((total: number, value: number) => total + value, 0) / yData.length) | 0
      : 0;

    // 小时产能按“当天 ∩ 生产登记时间”统计，并以登记/筛选开始时间为小时锚点。
    // 例如 10:40 开始：10:40-11:40、11:40-12:40，不再按自然整点切分。
    const rInfo = registrationInfo.value;
    const rawRegistrationStartTimestamp = rInfo?.startDate ? dayjs(rInfo.startDate).valueOf() : undefined;
    const rawRegistrationEndTimestamp = rInfo?.endDate
      ? dayjs(rInfo.endDate).valueOf()
      : getDetailRegistrationEffectiveEndTimestamp();
    const detailRange = props.detailView ? detailAnalysisDayRange.value : null;
    const baseStartTimestamp = detailRange?.startTimestamp ?? rawRegistrationStartTimestamp;
    const baseEndTimestamp = detailRange?.endTimestamp ?? rawRegistrationEndTimestamp;
    const globalSelectedRange = selectedHourTrendRange.value;
    const registrationStartTimestamp = globalSelectedRange
      ? Math.max(baseStartTimestamp ?? globalSelectedRange.startTimestamp, globalSelectedRange.startTimestamp)
      : baseStartTimestamp;
    const registrationEndTimestamp = globalSelectedRange
      ? Math.min(baseEndTimestamp ?? globalSelectedRange.endTimestamp, globalSelectedRange.endTimestamp)
      : baseEndTimestamp;

    const hourlyCapacityData = formatHourlyCapacityChartData(stationSignalList, {
      nowTimestamp,
      standardBeat: lineBeatBaseValue.value,
      dayTimestamp: detailAnalysisDate.value ? detailRange?.dayTimestamp : undefined,
      multiDay: props.detailView && !detailAnalysisDate.value,
      registrationStartTimestamp,
      registrationEndTimestamp,
    });

    stationBeatChartData3.xData = hourlyCapacityData.xData;
    stationBeatChartData3.yData = hourlyCapacityData.yData;
    stationBeatChartData3.abnormalYData =
      hourlyCapacityData.abnormalYData || hourlyCapacityData.xyData.map((item) => item.abnormalCount || 0);
    stationBeatChartData3.xyData = hourlyCapacityData.xyData;

    if (chartType.value != "normal" && chartType.value != "hour") {
      const max = parseInt(chartType.value);

      function generateArray(max: number, total = 120) {
        const result: number[] = [];
        let start = max;

        while (start <= total) {
          result.push(start);
          start += max;
        }

        return result;
      }

      const newXData = generateArray(max);
      const counts: number[] = Array(newXData.length).fill(0);
      let errorList = 0;

      for (const val of yData) {
        if (val > 120) {
          errorList += 1;
          continue;
        }

        for (let i = 0; i < newXData.length; i++) {
          const start = i === 0 ? 0 : newXData[i - 1];
          const end = newXData[i];

          if (i === newXData.length - 1) {
            if (val >= start && val <= end) {
              counts[i] += 1;
              break;
            }
          } else if (val >= start && val < end) {
            counts[i] += 1;
            break;
          }
        }
      }

      stationBeatChartData2.xData = [...newXData, "大于120"];
      stationBeatChartData2.yData = [...counts, errorList];
    }

    stationBeatChartData.xyData = xyData;
    stationBeatChartData.xData = xData;
    stationBeatChartData.yData = chartYData;
    stationBeatChartData.standardBeat = lineBeatBaseValue.value || 0;
    stationBeatChartData.markLineValue = markLineValue;
    // 当前小时次数仍由当前趋势 xyData.length 表示；
    // 当天累计次数必须使用完整当天数据。
    stationBeatChartData.todayRecordsTotal = stationTodayRecordsTotal;

    // 平均节拍始终从节拍排行原始数据读取，不能依赖右侧当前显示模式。
    let value = allStationBeatRankRaw.value.find(
      (item) => item.virtualStationInfo?.id === selectVirtualStationInfo.value?.id
    );
    if (!value) {
      value = formatSignalAllStationRankData(
        getBeatRecordsInSelectedHours(
          props.detailView ? getBeatRecordsInDetailDay(allStationSignalList.value) : todayAllStationSignalList.value
        )
      ).xyData.find((item) => item.virtualStationInfo?.id === selectVirtualStationInfo.value?.id);
    }
    stationBeatChartData.average = value?.average || 0;

    if (props.detailView) return;

    if (lastData == 0) {
      lastData = yData[yData.length - 1];
    }

    // 异常次数接口只在首次渲染/切换岗位时读取；实时刷新不再重复拉同一份数据。
    const exceptionKey = `${registrationInfo.value?.id || 0}:${selectVirtualStationInfo.value?.id || 0}`;
    if (lastExceptionQueryKey.value !== exceptionKey) {
      let data2 = await getOutOfAverage({
        registrationId: (registrationInfo.value?.id as number) || 0,
        virtualStationId: (selectVirtualStationInfo.value?.id as number) || 0,
      });
      if (!data2) data2 = "0_0";
      const [, count] = data2.split("_");
      exceedAvgCount.value = Number(count) || 0;
      lastExceptionQueryKey.value = exceptionKey;
    }

    const lastX = xData[xData.length - 1];
    const timestamp = lastX ? new Date(`${dayjs().format("YYYY-MM-DD")} ${lastX}`).getTime() : Date.now();
    console.log(selectVirtualStationInfo.value, registrationInfo.value);
    if (isFisrt.value) {
      isFisrt.value = false;
      return;
    }

    // 选定小时用于历史分析，不参与实时异常累计和告警写入。
    if (selectedHourTrendRange.value) return;

    setTimeout(async () => {
      if (exceptionSubmitting) return;

      const latestBeat = yData[yData.length - 1];
      if (!(latestBeat > stationBeatChartData.average && lastData !== latestBeat && lastData !== 0)) {
        return;
      }
      if (!lastData) return;

      exceptionSubmitting = true;
      try {
        // 写入异常前重新请求产线最新登记，避免使用页面缓存中的旧登记和旧工位。
        const latestContext = await getLatestBeatExceptionContext();
        if (!latestContext) return;

        const latestRegistrationInfo = latestContext.registrationInfo;
        const latestVirtualLineInfo = latestContext.virtualLineInfo;
        const latestVirtualStationInfo = latestContext.virtualStationInfo;
        const latestRegistrationId = Number(latestRegistrationInfo.id);
        const latestVirtualStationId = Number(latestVirtualStationInfo.id);
        const latestExceptionKey = `${latestRegistrationId}:${latestVirtualStationId}`;

        // 登记或工位已经变化时，先读取新登记下的异常次数，不能沿用旧登记的累计值。
        if (lastExceptionQueryKey.value !== latestExceptionKey) {
          let latestCountData = await getOutOfAverage({
            registrationId: latestRegistrationId,
            virtualStationId: latestVirtualStationId,
          });
          if (!latestCountData) latestCountData = "0_0";
          const [, latestCount] = latestCountData.split("_");
          exceedAvgCount.value = Number(latestCount) || 0;
          lastExceptionQueryKey.value = latestExceptionKey;
        }

        exceedAvgCount.value += 1;
        const maxLimit = Number(latestVirtualLineInfo?.standardBeat) || 0;
        const currentCount = Number(exceedAvgCount.value) || 0;
        if (!maxLimit) return;

        // 提前记录本次节拍，防止异步接口期间被下一轮渲染重复上报。
        lastData = latestBeat;
        await addOutOfAverage({
          virtualStationId: latestVirtualStationId,
          registrationId: latestRegistrationId,
          timestamp,
        });

        if (currentCount > maxLimit) {
          await beatExceptionAdd({
            registrationId: latestRegistrationId,
            virtualStationId: latestVirtualStationId,
            standardBeat: latestVirtualLineInfo?.standardBeat,
            singleConSum: latestBeat,
            sumAvg: stationBeatChartData.average,
            exDesc: `【${latestRegistrationInfo?.lineInfo?.lineName || lineInfo.value?.lineName || ""}-${
              latestVirtualStationInfo?.virtualStationName || ""
            }】单次作业时间超出平均值预设上限`,
            beatType: 2,
            timestamp,
          });
        }
      } catch (error) {
        console.error("刷新最新登记或写入节拍异常失败", error);
      } finally {
        exceptionSubmitting = false;
      }
    }, 100);
  }

  /** 获取全工位信号数据 */
  async function toGetAllStationSignal() {
    const rInfo = registrationInfo.value!!;
    const isPDX = isPDXLine(lineInfo.value?.lineType);
    const { lineId } = rInfo;

    let requestStartTimestamp: number;
    let requestEndTimestamp: number;

    if (props.detailView) {
      ensureDetailAnalysisDate();

      const range = detailAnalysisDayRange.value;
      if (!range || range.endTimestamp <= range.startTimestamp) {
        allStationSignalList.value = [];
        todayAllStationSignalList.value = [];
        return;
      }

      // 详情页只请求当前选择的自然日。
      // 开始时间严格使用 max(当天 00:00, 登记开始时间)，
      // 不再额外向前取 1 小时，因此中间日期会从当天 00:00 开始，
      // 不会出现前一天 23:00。
      requestStartTimestamp = range.startTimestamp;
      requestEndTimestamp = range.endTimestamp;
    } else {
      // 普通数据分析页保持原来的请求口径。
      requestStartTimestamp = dayjs(rInfo.startDate).valueOf();
      requestEndTimestamp = getAnalysisNowTimestamp();
    }

    const startDate = formatDateByDayjs(requestStartTimestamp, "YYYY-MM-DD HH:mm:ss");
    const endDate = formatDateByDayjs(requestEndTimestamp, "YYYY-MM-DD HH:mm:ss");

    let records: SignalDataInfo[];
    if (isPDX) {
      records = await signalSpecifyDateData({
        type: SubModuleType.SCALE,
        lineId,
        startDate,
        endDate,
      });
      records = transformScale2General(startDate, endDate, records, true);
    } else {
      records = await signalSpecifyDateData({
        type: SubModuleType.GENERAL_INPUT,
        lineId,
        startDate,
        endDate,
      });
    }

    const sourceRecords = records || [];

    // 两个引用共享同一份底层原始数据，避免初始化时完整复制一遍。
    allStationSignalList.value = sourceRecords;
    todayAllStationSignalList.value = sourceRecords;

    rebuildSignalIndexes(sourceRecords);
  }

  let lastData = 0;
  let exceptionSubmitting = false;
  const exceedAvgCount = ref<number>(0);
  // 避免实时刷新时重复请求同一岗位的异常累计数据。
  const lastExceptionQueryKey = ref("");

  const showTime = computed(() => {
    let [startTime, endTime] = ["", ""];
    if (timeRange.value) {
      startTime = dayjs(timeRange.value[0]).format("HH:mm");
      endTime = dayjs(timeRange.value[1]).format("HH:mm");
    }
    return startTime ? `${startTime}-${endTime}` : "";
  });
  /** 根据用户主动选择的排行模式写入顶部图表。 */
  function applyStationRankChartData() {
    // 生产登记详情顶部固定显示“岗位登记总产能”，不再显示岗位平均节拍。
    if (props.detailView) {
      const sortedList = allStationRegistrationCapacityRaw.value
        .slice()
        .filter((item) => Number.isFinite(Number(item.totalCapacity)));

      const values = sortedList.map((item) => Number(item.totalCapacity) || 0);
      const labels = sortedList.map((item) => getVirtualStationText(item.virtualStationInfo));

      allStationBeatChartData.xyData = sortedList;
      allStationBeatChartData.xData = labels;
      allStationBeatChartData.yData = values;
      allStationBeatChartData.highlightMaxBeat = false;
      allStationBeatChartData.markLineValue = 0;
      return;
    }

    const hourMode = isHourRank.value;
    const valueKey = hourMode ? "averageHourlyCapacity" : "average";
    const source = hourMode ? allStationHourlyCapacityRankRaw.value : allStationBeatRankRaw.value;

    const sortedList = source.slice().filter((item) => Number.isFinite(Number(item[valueKey])));

    const values = sortedList.map((item) => Number(item[valueKey]) || 0);
    const labels = sortedList.map((item) => getVirtualStationText(item.virtualStationInfo));

    // 节拍越低越好；标准小时产能越高越好。平均标准小时产能排行标记前三名。
    const highlightedIndexes = new Set<number>();
    if (hourMode) {
      const startIndex = Math.max(0, values.length - 3);
      for (let i = startIndex; i < values.length; i++) highlightedIndexes.add(i);
    }

    const seriesData = values.map((value, index) =>
      highlightedIndexes.has(index)
        ? {
            value,
            itemStyle: {
              color: "#ff5f5f",
            },
          }
        : value
    );

    allStationBeatChartData.xyData = sortedList;
    allStationBeatChartData.xData = labels;
    allStationBeatChartData.yData = hourMode ? seriesData : values;
    allStationBeatChartData.highlightMaxBeat = !hourMode;
    allStationBeatChartData.markLineValue = values.length
      ? numberToFixed(values.reduce((total, value) => total + value, 0) / values.length)
      : 0;
  }

  /** 渲染全工位节拍排行及平均标准小时产能排行 */
  async function toRenderAllStationBeatData() {
    const sourceRecords = props.detailView
      ? getBeatRecordsInDetailDay(allStationSignalList.value)
      : allStationSignalList.value;

    // 所选小时范围统一作用于顶部岗位排行、平均节拍、线平衡和产线平均小时产能。
    const beatRankData = formatSignalAllStationRankData(getBeatRecordsInSelectedHours(sourceRecords));
    allStationBeatRankRaw.value = beatRankData.xyData;

    const validBeatList = beatRankData.xyData.filter(
      (item) => Number.isFinite(Number(item.average)) && Number(item.average) > 0
    );
    if (validBeatList.length) {
      const maxBeatItem = validBeatList.reduce((maxItem, item) =>
        Number(item.average) > Number(maxItem.average) ? item : maxItem
      );
      lineBeatChartData.maxLabel = getVirtualStationText(maxBeatItem.virtualStationInfo);
      lineBeatChartData.maxStationId = maxBeatItem.virtualStationInfo?.id ?? null;
    } else {
      lineBeatChartData.maxLabel = "";
      lineBeatChartData.maxStationId = null;
    }

    // 标准小时产能与岗位总产能统一使用：
    // max(所选日00:00, 登记开始) ~ min(次日00:00, 登记结束/当前时间)。
    const nowTimestamp = getAnalysisNowTimestamp();
    const rInfo = registrationInfo.value;
    // console.log(rInfo);

    const selectedRange = selectedHourTrendRange.value;
    const rawRegistrationStartTimestamp = rInfo?.startDate ? dayjs(rInfo.startDate).valueOf() : undefined;
    const rawRegistrationEndTimestamp = rInfo?.endDate
      ? dayjs(rInfo.endDate).valueOf()
      : getDetailRegistrationEffectiveEndTimestamp();

    const detailRange = props.detailView ? detailAnalysisDayRange.value : null;
    const baseStartTimestamp = detailRange?.startTimestamp ?? rawRegistrationStartTimestamp;
    const baseEndTimestamp = detailRange?.endTimestamp ?? rawRegistrationEndTimestamp;

    const registrationStartTimestamp = selectedRange
      ? Math.max(baseStartTimestamp ?? selectedRange.startTimestamp, selectedRange.startTimestamp)
      : baseStartTimestamp;
    const registrationEndTimestamp = selectedRange
      ? Math.min(baseEndTimestamp ?? selectedRange.endTimestamp, selectedRange.endTimestamp)
      : baseEndTimestamp;

    /**
     * 全岗位标准小时产能排行非常重（需要逐岗位做小时聚合），
     * 只有用户真正切到“标准小时产能排行”时才计算。
     */
    if (isHourRank.value) {
      const hourlyRankData = formatSignalAllStationHourlyCapacityRankData(
        props.detailView ? sourceRecords : todayAllStationSignalList.value,
        {
          nowTimestamp,
          standardBeat: lineBeatBaseValue.value,
          dayTimestamp: detailAnalysisDate.value ? detailRange?.dayTimestamp : undefined,
          multiDay: props.detailView && !detailAnalysisDate.value,
          registrationStartTimestamp,
          registrationEndTimestamp,
        }
      );

      allStationHourlyCapacityRankRaw.value = hourlyRankData.xyData;
    }

    // 登记总产能只在详情页顶部使用，普通主页不再白算。
    if (props.detailView) {
      const topCapacityRange = lineCapacityTopRange.value;

      const registrationCapacityData = formatSignalAllStationRegistrationCapacityData(allStationSignalList.value, {
        registrationStartTimestamp: topCapacityRange?.startTimestamp ?? baseStartTimestamp,
        registrationEndTimestamp: topCapacityRange?.endTimestamp ?? baseEndTimestamp,
      });

      allStationRegistrationCapacityRaw.value = registrationCapacityData.xyData;
    }

    applyStationRankChartData();
  }
  /** 渲染线体线平衡趋势 */
  async function toRenderLineBalanceBeatData() {
    /**
     * 线平衡和产线平均小时产能都跟随顶部时间范围，
     * 并以登记/筛选开始时间为小时锚点。
     *
     * 默认范围：
     * 1. 普通数据分析页：当前登记/当天完整有效范围；
     * 2. 登记详情页：当前统计日期；未选日期时为整条登记。
     *
     * 点击“产线平均小时产能”柱子触发上方时间筛选时，
     * 顶部岗位数据、岗位小时产能、线平衡和产线平均小时产能
     * 都切到同一统计时段。
     */
    const dayRecords = props.detailView
      ? getBeatRecordsInDetailDay(allStationSignalList.value)
      : todayAllStationSignalList.value;

    const summaryRecords = dayRecords;

    const defaultRange = getDefaultRegistrationTimeRange();
    const detailRange = props.detailView ? detailAnalysisDayRange.value : null;
    const baseStartTimestamp = detailRange?.startTimestamp ?? defaultRange?.startTimestamp;
    const baseEndTimestamp = detailRange?.endTimestamp ?? defaultRange?.endTimestamp;
    const selectedRange = selectedHourTrendRange.value;
    const summaryStartTimestamp = selectedRange
      ? Math.max(baseStartTimestamp ?? selectedRange.startTimestamp, selectedRange.startTimestamp)
      : baseStartTimestamp;
    const summaryEndTimestamp = selectedRange
      ? Math.min(baseEndTimestamp ?? selectedRange.endTimestamp, selectedRange.endTimestamp)
      : baseEndTimestamp;
    const summaryTimeRange =
      Number.isFinite(summaryStartTimestamp) &&
      Number.isFinite(summaryEndTimestamp) &&
      (summaryEndTimestamp as number) > (summaryStartTimestamp as number)
        ? {
            startTimestamp: summaryStartTimestamp as number,
            endTimestamp: summaryEndTimestamp as number,
          }
        : null;

    /**
     * 线平衡汇总值与折线使用相同的筛选范围。
     * 保留范围开始前每个岗位最后一条信号，确保首个节拍可以正常计算。
     */
    const balanceRankRecords = selectedRange ? getBeatRecordsInSelectedHours(summaryRecords) : summaryRecords;
    const balanceRankData = formatSignalAllStationRankData(balanceRankRecords);
    allStationBeatRaw.value = balanceRankData.xyData;

    /** 同步生成产线平均小时产能。 */
    {
      const lineCapacityData = formatLineHourlyCapacityChartData(summaryRecords, {
        nowTimestamp: getAnalysisNowTimestamp(),
        standardBeat: lineBeatBaseValue.value,
        dayTimestamp: props.detailView && detailAnalysisDate.value ? detailRange?.dayTimestamp : undefined,
        multiDay: props.detailView && !detailAnalysisDate.value,
        registrationStartTimestamp: summaryTimeRange?.startTimestamp,
        registrationEndTimestamp: summaryTimeRange?.endTimestamp,
      });
      lineHourlyCapacityChartData.xData = lineCapacityData.xData;
      lineHourlyCapacityChartData.yData = lineCapacityData.yData;
      lineHourlyCapacityChartData.xyData = lineCapacityData.xyData;
      lineHourlyCapacityChartData.markLineValue = lineCapacityData.markLineValue || 0;
    }

    // 2、线平衡
    {
      const data2 = formatBalanceListChartData(summaryRecords, undefined, summaryTimeRange);
      // console.log(data2);
      const { xData, yData, xyData, markLineValue } = data2;
      lineBalanceChartData.xyData = xyData;
      lineBalanceChartData.xData = xData;
      lineBalanceChartData.yData = yData;

      // 线平衡原计算公式 间隔时间和/总数
      // lineBalanceChartData.markLineValue = markLineValue || 0;

      // 线平衡新计算公式 岗位节拍排行去算/总数
      const wholeAllStationData = allStationBeatRaw.value;

      // 剔除无效工位
      const allStationData = wholeAllStationData.filter((i) => i.average);

      const lineAvgSum = allStationData.reduce((total, prev) => total + prev.average, 0);
      const maxAverageBeat = allStationData.length ? Math.max(...allStationData.map((i) => i.average)) : 0;
      const stationTotal = allStationData.length;

      let lineBalance = (lineAvgSum / (maxAverageBeat * stationTotal)) * 100;
      lineBalance = numberToFixed(lineBalance || 0);
      // console.log({ lineBalanceChartData, allStationData, lineAvgSum, maxAverageBeat, stationTotal });

      lineBalanceChartData.stationTotal = stationTotal;
      lineBalanceChartData.lineAvgSum = lineAvgSum;
      lineBalanceChartData.maxAverageBeat = maxAverageBeat;
      lineBalanceChartData.markLineValue = lineBalance;
    }

    // 3、同步线体排行表单,按平均节拍 降序
    updateStationRankSource("average", "descend");

    close();
  }

  /** 工位排行页码回调 */
  function onStationRankChange(pageNo: number) {
    stationRankData.pageNo = pageNo;
  }

  /** 工位排行表单变化 */
  // function handleRankTableChange(pagination: any, filters: any, sorter: any) {
  //   const { field, order } = sorter;
  //   updateStationRankSource(field, order);
  // }

  /** 基于字段和排序重排排名数据 */
  function updateStationRankSource(field?: string, order?: string) {
    // 浅拷贝
    let l = allStationBeatRaw.value.slice();

    // 剔除节拍为0的条目
    l = l.filter((i) => i.average !== 0);

    if (!order) {
      stationRankSource.value = l;
      return;
    }

    if (order === "ascend") {
      // 升序
      l.sort((a, b) => a[field!!] - b[field!!]);
    } else {
      // 降序
      l.sort((a, b) => b[field!!] - a[field!!]);
    }

    stationRankSource.value = l;
  }
  /** 进入全屏 */
  const enterFullscreen = () => {
    isFullscreen.value = true;
  };

  /** 退出全屏 */
  const exitFullscreen = () => {
    isFullscreen.value = false;
  };

  /** ESC 退出 */
  const handleEsc = (e) => {
    if (e.key === "Escape" && isFullscreen.value) {
      exitFullscreen();
    }
  };

  onBeforeUnmount(() => {
    document.removeEventListener("keydown", handleEsc);
  });

  /** 宽高自适应 */
  const realChartWidth = computed(() => {
    return isFullscreen.value ? window.innerWidth : chartWidth;
  });

  const realChartHeight = computed(() => {
    return isFullscreen.value ? window.innerHeight - 56 : chartHeight;
  });

  /** 手动切换小时只更新时间范围，保留当前图表模式。 */
  async function handleTimeRangeChange(value: [Dayjs, Dayjs] | null) {
    console.log(value);
    if (!value?.[0] || !value?.[1]) {
      await cancelTimeRange();
      return;
    }

    if (!setSelectedHours(value[0].valueOf(), value[1].valueOf())) return;

    isCustomTimeRange.value = true;
    lineCapacityTopRange.value = null;
    hourlyCapacityDrilldownRange.value = null;
    await renderSelectedHours();
  }

  /** 取消时间筛选：普通页回到“未选择时间”，详情页回登记默认范围。 */
  async function cancelTimeRange() {
    if (props.detailView) {
      resetTimeRangeToRegistration();
    } else {
      clearTimeRangeSelection();
    }

    lineCapacityTopRange.value = null;
    hourlyCapacityDrilldownRange.value = null;
    lastData = 0;
    isFisrt.value = true;

    await renderSelectedHours();
  }
</script>

<style lang="less" scoped>
  .line-summary-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    min-width: 0;
  }

  .line-summary-header :deep(.sub-title2) {
    min-width: 0;
  }

  .line-summary-switch {
    display: flex;
    flex: 0 0 auto;
    gap: 4px;
    padding-right: 4px;
  }

  .normal-bottom-panels {
    position: relative;
    display: grid;
    width: 100%;
    min-width: 0;
    align-items: stretch;
  }

  .normal-bottom-panel {
    width: 100%;
    min-width: 0;
    overflow-x: clip;
    overflow-y: visible;
  }

  .normal-panel-resizer {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 18px;
    transform: translateX(-50%);
    z-index: 9999;
    cursor: col-resize !important;
    user-select: none;
    -webkit-user-select: none;
    background: transparent;
  }

  .normal-panel-resizer::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 1px;
    transform: translateX(-50%);
    background: #d9d9d9;
    transition: width 0.15s ease, background-color 0.15s ease;
  }

  .normal-panel-resizer:hover::before,
  .normal-panel-resizer.is-resizing::before {
    width: 4px;
    background: #1890ff;
  }

  .detail-analysis-view {
    width: 100%;
    min-width: 0;
  }

  .detail-view-toolbar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    min-height: 36px;
    padding: 0 4px 6px;
  }

  .detail-view-toolbar__actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .detail-view-toolbar__label {
    color: #6b7280;
    font-size: 13px;
  }

  .detail-day-select {
    width: 132px;
  }

  .detail-trend-actions {
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding: 0 6px 4px 0;
  }

  .detail-top-panel {
    padding-top: 2px;
  }

  .detail-capacity-chart {
    margin-top: 8px;
    margin-bottom: 10px;
  }

  .detail-top-panel {
    width: 100%;
  }

  .detail-bottom-panels {
    position: relative;
    display: grid;
    width: 100%;
    min-width: 0;
    align-items: stretch;
    border-top: 1px dashed #ddd;
  }

  .detail-bottom-panel {
    width: 100%;
    min-width: 0;
    overflow-x: clip;
    overflow-y: visible;
  }

  /*
   * 分隔条使用绝对定位覆盖在两个 ECharts 面板之间。
   * 18px 热区确保鼠标不需要精准对准 1px 竖线。
   */
  .detail-panel-resizer {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 18px;
    transform: translateX(-50%);
    z-index: 9999;
    cursor: col-resize !important;
    user-select: none;
    -webkit-user-select: none;
    background: transparent;
  }

  .detail-panel-resizer::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 1px;
    transform: translateX(-50%);
    background: #d9d9d9;
    transition: width 0.15s ease, background-color 0.15s ease;
  }

  .detail-panel-resizer:hover::before,
  .detail-panel-resizer.is-resizing::before {
    width: 4px;
    background: #1890ff;
  }

  .top-chart-section {
    position: relative;
  }

  /* 头部：左标题右操作，两端对齐 */
  .top-chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  /* 右侧操作栏 */
  .top-chart-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  /* 操作组：内部紧凑间距 */
  .action-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* 取消筛选按钮：弱化视觉权重 */
  .action-group .ant-btn-link {
    padding: 0 4px;
    height: auto;
    line-height: 1;
  }

  .chart1 {
    border-bottom: 1px dashed #ccc;
    position: relative;
  }

  .top-chart-switch {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-bottom: 8px;
  }

  .chart1 {
    border-bottom: 1px dashed #ccc;
  }

  .average-danger {
    color: @color-danger;
    font-weight: bold;
    font-size: 16px;
  }

  :deep {
    .my-table .ant-table {
      height: 235px;
    }
  }

  .chart1 {
    position: relative;
  }

  /* 工具栏 */
  .chart-toolbar {
    position: absolute;
    top: 8px;
    right: 12px;
    z-index: 10;
  }

  .chart-toolbar button {
    padding: 4px 10px;
    cursor: pointer;
  }

  /* 全屏状态 */
  .chart1.is-fullscreen {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: #fff;
    padding-top: 40px;
  }

  // .chart-wrapper {
  //   position: relative;
  // }

  // .chart-actions {
  //   position: absolute;
  //   right: 12px;
  //   top: 12px;
  //   z-index: 10;
  //   display: flex;
  //   align-items: center;
  // }

  /* 面板整体：竖向排列，图表占满剩余高度 */
  .normal-hour-panel {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  /* 头部：标题 + 操作，两端对齐，窄屏自动换行 */
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px 12px;
    margin: 16px 0 8px;
    min-height: 32px;
  }

  /* 标题：允许收缩，去掉 SubTitle2 自带的外边距 */
  .panel-header__title {
    flex: 1 1 auto;
    min-width: 0;
    margin: 0;

    :deep(.sub-title2) {
      margin: 0;
    }
  }

  /* 操作区：不收缩、可换行、统一 gap 间距 */
  .panel-header__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 0 0 auto;
    flex-wrap: wrap;
    gap: 8px;
    padding-right: 8px;
  }

  /* 图表容器：只作为布局占位，不再需要 relative 定位 */
  .chart-wrapper {
    flex: 1 1 auto;
    min-width: 0;
  }
</style>
