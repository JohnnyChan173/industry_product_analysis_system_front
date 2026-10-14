<template>
  <div class="ct">
    <hr />
    <p class="text-20px my-12px font-bold">基础数据上传</p>
    <a-upload name="file1" :beforeUpload="handleFile1Change" :showUploadList="false">
      <a-button>
        <UploadOutlined />
        1.上传货架分布xlsx
      </a-button>
    </a-upload>

    <a-upload class="mx-4px" name="file1" :beforeUpload="handleFile2Change" :showUploadList="false">
      <a-button>
        <UploadOutlined />
        2.上传订单分析xlsx
      </a-button>
    </a-upload>

    <a-upload class="mx-4px" name="file1" :beforeUpload="handleFile3Change" :showUploadList="false">
      <a-button>
        <UploadOutlined />
        3.上传货物排序xlsx
      </a-button>
    </a-upload>

    <div>
      <p v-if="disList.length" class="text-green-500">
        - 货架解析完成，共 {{ disList.length }} 个区域
      </p>
      <p v-else class="text-red-500">- 货架待解析</p>
    </div>

    <div class="my-12px">
      <p v-if="proList.length" class="text-green-500">
        - 订单解析完成，共 {{ proList.length }} 个产品
      </p>
      <p v-else class="text-red-500">- 订单待解析</p>
    </div>

    <div class="my-12px">
      <p v-if="sorList.length" class="text-green-500">
        - 排序解析完成，共 {{ sorList.length }} 个排序
      </p>
      <p v-else class="text-red-500">- 排序待解析</p>
    </div>

    <p v-if="disProList.length" class="text-blue-500">
      ★ 分布数据加工完成：已完善 {{ disProList.length }} 个区域。
      <span v-if="emptyDisProList.length" class="text-red-500">
        区域内共 {{ emptyDisProList.length }} 款产品无法映射名称
      </span>
    </p>

    <div v-if="emptyDisProList.length">
      <a-tag v-for="item in emptyDisProList" :key="item.model" color="pink">
        【{{ item.house }}】-{{ item.model }}
      </a-tag>
    </div>

    <hr class="mt-22px" />
    <p class="text-20px my-12px font-bold">
      功能1：货架标签打印
      <a class="text-blue-500 text-14px ml-3px" @click="toggleAbility1Show">
        {{ ability1Show ? '隐藏' : '显示' }}
      </a>
    </p>

    <div v-show="ability1Show">
      <div class="flex items-center my-12px">
        <p>打印机ip:</p>
        <a-input class="w-150px" v-model:value="printIp"></a-input>
        <p class="ml-4px">打印机port:</p>
        <a-input class="w-150px" v-model:value="printPort"></a-input>

        <a-button
          class="ml-24px"
          type="primary"
          @click="handleComposePrint"
          :disabled="!selectedProductKeys.length"
        >
          打印产品码({{ selectedProductKeys.length }})
        </a-button>
        <a
          v-if="selectedProductKeys.length"
          class="text-blue-500 ml-3px"
          @click="handleClearSelect"
        >
          清空
        </a>
      </div>

      <!-- 展示区域数据 -->
      <div v-if="disProList.length">
        <a-tabs v-model:activeKey="activeHouse" tab-position="top" @change="handleHouseTabChange">
          <a-tab-pane v-for="[house, productList] in disProList" :key="house" :tab="house">
            <!-- 生成表格 -->
            <div class="tab-table">
              <a-table
                :columns="houseColumn"
                :data-source="productList"
                :pagination="false"
                size="small"
                :row-selection="{
                  selectedRowKeys: selectedProductKeys,
                  onSelect: onProductSelectChange,
                  onSelectAll: onProductSelectAll
                }"
              >
                <template #bodyCell="{ column, record }">
                  <!-- <template v-if="column.key === 'name'">
                <a>
                  {{ record.name }}
                </a>
              </template> -->
                </template>
              </a-table>
            </div>
          </a-tab-pane>
        </a-tabs>
      </div>
    </div>

    <hr />
    <p class="text-20px my-12px font-bold">
      功能2：销售订单加工
      <a class="text-blue-500 text-14px ml-3px" @click="toggleAbility2Show">
        {{ ability2Show ? '隐藏' : '显示' }}
      </a>
    </p>

    <div v-show="ability2Show">
      <p v-if="!canUploadOrderXlsx" class="text-red-500">请先上传基础数据</p>
      <div v-else>
        <a-upload multiple :beforeUpload="handleOrderFileChange" :showUploadList="false">
          <a-button>
            <UploadOutlined />
            上传销售订单(js-xlsx版)
          </a-button>
        </a-upload>
        <a-upload :beforeUpload="handleOrderFileDirectoryChange" directory :showUploadList="false">
          <a-button class="ml-6px">
            <UploadOutlined />
            上传销售订单文件夹(js-xlsx版)
          </a-button>
        </a-upload>
      </div>
    </div>

    <a-upload :beforeUpload="handleExceljsClick" :showUploadList="false">
      <a-button class="mt-12px">
        <UploadOutlined />
        上传销售订单(exceljs版)
      </a-button>
    </a-upload>

    <div>
      <a-button type="primary" @click="handleStorageSaveJson">localStorage输出为json</a-button>

      <a-upload :beforeUpload="handleJsonImport2Storage" :showUploadList="false">
        <a-button type="primary" class="mt-12px ml-6px">
          <UploadOutlined />
          json导入为localStorage
        </a-button>
      </a-upload>
    </div>

    <!-- 打印机画布 -->
    <PrinterCanvas :show="false" />
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { message, Modal, notification } from 'ant-design-vue'
import { UploadOutlined } from '@ant-design/icons-vue'
import PrinterCanvas from './components/PrinterCanvas.vue'
import machineConnection from './printer/MachineConnection'
import { printerCanvasModel, printerModeEnums } from './printer/config'
import utilStorage from './utils/storage/utilStorage'
import { errorToast } from './utils/toast'
import {
  randomId,
  delay,
  readFile,
  binary2Blob,
  downloadFile,
  strToArrayBuffer,
  binary2BlobPart,
  ab2str
} from './utils/tool'
import { cloneDeep } from 'lodash'
import { MAX_PRODUCT_SORT } from './config/index'
import { genDownloadJSZip } from './utils/jszip'
import {
  getSheetData,
  parseSheetData,
  downloadWorkbook as downloadWorkbookJsXlsx,
  getWorkbookU8
} from './utils/xlsx/index'
import { parseOrderData, injectTemplateOrderXlsx } from './utils/xlsx/service'
import { getWorkbookFromFile, downloadWorkbook } from './utils/exceljs'
import { parseOrderWorkbook } from './utils/exceljs/service'
import dayjs from 'dayjs'
import saveAs from 'file-saver'

const defaultPrintIp = '192.168.1.198'
const defaultPrintPort = 9100

// 最大排序
const directoryObj = {
  timer: null,
  timerDelay: 500,
  fileList: []
}
const printIp = ref('')
const printPort = ref('')

// 分布列表
const disList = ref([])
// 产品列表
const proList = ref([])
// 排序列表
const sorList = ref([])
// 分布产品列表
const disProList = ref([])

// 当前选中区域
const activeHouse = ref('')

// 功能1显示隐藏
const ability1Show = ref(false)

// 功能2显示隐藏
const ability2Show = ref(true)

// 表格字段定义
const houseColumn = [
  {
    title: '货架',
    dataIndex: 'house',
    width: 110
  },
  {
    title: '货架-产品名称',
    dataIndex: 'name'
  },
  {
    title: '货架-产品型号',
    dataIndex: 'model'
  },
  {
    title: '排序值',
    dataIndex: 'sort'
  },
  {
    title: '订单-产品名称',
    dataIndex: 'orderName'
  },
  {
    title: '订单-产品型号',
    dataIndex: 'orderModel'
  }
]

// 选中产品定义
const selectedProductKeys = ref([])

// 分布产品名称空项
const emptyDisProList = computed(() => {
  const l = disProList.value
  if (!l.length) {
    return 0
  } else {
    // 先扁平
    const ll = getDPFlatList()

    return ll.filter((i) => i.model && !i.name)
  }
})

// 是否上传完基础数据
const canUploadOrderXlsx = computed(() => {
  const l1 = disList.value
  const l2 = proList.value
  const l3 = sorList.value

  return l1.length && l2.length && l3.length
})

onMounted(() => {
  // 获取存储IP 和 port
  const pIp = utilStorage.getPrintIp() || defaultPrintIp
  const pPort = utilStorage.getPrintPort() || defaultPrintPort
  printIp.value = pIp
  printPort.value = pPort

  // 获取 分布 产品 数据
  const dList = utilStorage.getDisList() || []
  const pList = utilStorage.getProList() || []
  const sList = utilStorage.getSorList() || []
  const dpList = utilStorage.getDisProList() || []

  disList.value = dList
  proList.value = pList
  sorList.value = sList
  disProList.value = dpList
})

/** json导入为localStorage */
async function handleJsonImport2Storage(file) {
  try {
    const json = await readFile(file, 'text')
    const jsonText = decodeURIComponent(json)
    const obj = JSON.parse(jsonText)

    const { dList, pList, sList, dpList } = obj

    disList.value = dList
    proList.value = pList
    sorList.value = sList
    disProList.value = dpList

    console.log('注入完成')
  } catch (e) {
    console.error(e)
    errorToast(e)
  }
}

/** localStorage数据保存为json */
async function handleStorageSaveJson() {
  // 获取 分布 产品 数据
  const dList = utilStorage.getDisList() || []
  const pList = utilStorage.getProList() || []
  const sList = utilStorage.getSorList() || []
  const dpList = utilStorage.getDisProList() || []

  const wholeData = {
    dList,
    pList,
    sList,
    dpList
  }

  // const binary = JSON.stringify(wholeData)
  // console.log(binary)

  let binary = JSON.stringify(wholeData)
  binary = encodeURIComponent(binary)

  const blob = binary2Blob(binary)

  downloadFile(blob, 'base.json')
}

/** exceljs导入 */
async function handleExceljsClick(file) {
  try {
    const { name } = file

    if (!name.includes('.xlsx')) {
      errorToast('请上传 xlsx 格式文件')
      return
    }
    // 1、读取工作表
    const wb = await getWorkbookFromFile(file)
    console.log(wb)

    // 2、工作表 交给业务模块去解析
    const newWb = await parseOrderWorkbook(wb)
    console.log(newWb)

    // 3、下载新工作表
    downloadWorkbook(newWb)

    return Promise.reject()
  } catch (e) {
    console.log(e)
  }
}

/** 获取扁平数据 */
function getDPFlatList() {
  const l = disProList.value
  const ll = [].concat(...l.map((i) => i[1]))

  return ll
}

/** 功能2显影 */
function toggleAbility2Show() {
  ability2Show.value = !ability2Show.value
}

/** 功能1显影 */
function toggleAbility1Show() {
  ability1Show.value = !ability1Show.value
}

/** 产品选中 */
function onProductSelectChange(record, selected, selectedRows) {
  console.log(record, selected, selectedRows)
  if (selected) {
    const { key } = record
    selectedProductKeys.value.push(key)
  } else {
    const findIndex = selectedProductKeys.value.findIndex((i) => i === record.key)
    selectedProductKeys.value.splice(findIndex, 1)
  }
}

/** 产品全选 */
function onProductSelectAll(selected, selectedRows, changeRows) {
  if (selected) {
    // 理想情况是拿到当前页key 遍历置key
    const keys = changeRows.map((i) => i.key)
    selectedProductKeys.value.push(...keys)
  } else {
    // 理想情况是拿到当前页key 遍历置空
    const keys = changeRows.map((i) => i && i.key)
    keys.map((item) => {
      const findIndex = selectedProductKeys.value.findIndex((i) => i === item)
      selectedProductKeys.value.splice(findIndex, 1)
    })
  }
}

/** 标签栏选择 */
function handleHouseTabChange() {}

/** 选中清空 */
function handleClearSelect() {
  selectedProductKeys.value = []
}

/** 合成打印 */
async function handleComposePrint() {
  console.log('handleComposePrint')

  Modal.confirm({
    title: '是否开始打印',
    content: `打印进行期间，请不要进行任何操作`,
    okText: '打印',
    cancelText: '取消',
    async onOk() {
      try {
        const printerConfig = {
          ip: '192.168.1.198',
          port: 9100,
          dpi: 200
        }

        const pm = await machineConnection._registerPm(printerConfig)

        // 模式固定(PALLET 对应 100*120)
        const printerMode = printerModeEnums.PALLET

        const keys = selectedProductKeys.value

        // 开始循环
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i]
          // 先扁平
          const ll = getDPFlatList()
          // 根据key找数据
          const item = ll.find((i) => i.key === key)

          if (!item.name) {
            errorToast('产品名称不存在，已跳过')
            continue
          } else {
            notification.info({
              message: `打印进度 ${i + 1} /${keys.length}`
            })

            const { name, model, house } = item
            // 定义 drawParams
            const { createText } = printerCanvasModel

            // 100*120 常规
            const drawParams = [
              [18, 76, createText(80, name, 'bold', 730)],
              [18, 449, createText(70, model, 'normal', 730)],
              [18, 695, createText(70, house)]
            ]

            // 重新同步一次模式
            pm.setPrinterMode(printerMode)

            await pm.printerCanvas.setDrawParams(drawParams)

            await pm.draw()
            await pm.print()
            await pm.printer.disconnect()
            // await delay(5000)
          }
        }
      } catch (e) {
        console.error(e)
        errorToast(e.message)
      }
    }
  })
}

/** 加工分布列表 */
function processDisList() {
  const dList = cloneDeep(disList.value)
  const pList = cloneDeep(proList.value)
  const sList = cloneDeep(sorList.value)

  if (!dList.length || !pList.length || !sList.length) {
    console.log('数据未上传完整，无法加工')
    return
  }

  // 订单注入排序
  for (let i = 0; i < pList.length; i++) {
    const product = pList[i]
    // 寻找排序
    const findSort = sList.find((i) => i.model === product.model)
    if (findSort) {
      product.sort = findSort.sort
    } else {
      console.warn('当前产品无排序值')
      product.sort = MAX_PRODUCT_SORT
    }
  }

  // 本地存储
  utilStorage.setDisList(dList)
  utilStorage.setProList(pList)
  utilStorage.setSorList(sList)

  // 分布里实际包的左右
  // 正则 => /(\(|（)包(\)|）)/
  const baoText = '包'

  /** 包匹配逻辑抽离 */
  function baoProductProcess(product, matchModel, isTwice = false) {
    // 模糊匹配 清单
    const findPros = pList.filter((p) => p.model.includes(matchModel))

    // 边界：匹配到
    if (findPros.length > 0) {
      // 边界：匹配到多个
      // 子边界1：溢出
      if (findPros.length > 2) {
        console.warn(product, `在清单中匹配到${findPros.length}个`, findPros)
      }

      // 仅取其一
      const onePro = findPros[0]
      const oneProName = onePro.name

      // 子边界2：检测有效性
      const jiangReg = /.桨/
      if (!jiangReg.test(oneProName)) {
        console.warn(product, onePro, `解析0号产品，名称不存在x桨字样`)
      }

      // 解析实际名称（踢掉x桨）
      const realName = oneProName.replace(jiangReg, '') + `（${baoText}）`

      // 属性扩展
      product.name = realName
      product.orderModel = onePro.model
      product.orderName = onePro.name
      product.sort = onePro.sort
      product.isBao = true

      // 策略匹配
    } else {
      // 说明第二轮匹配也未匹配到
      if (isTwice) {
        console.error(product, '第二轮匹配清单失败')
        return
      }

      // 说明未匹配到
      const sliceNumber = matchModel.slice(-1)
      const endNumber = parseInt(sliceNumber)

      // 如果最后一位是数字，尝试第二轮匹配
      if (!isNaN(endNumber)) {
        // 例 PMPC3018-2Y1 => PMPC3018-2YL1
        const sliceHalfModel = matchModel.slice(0, -1) + 'L' + sliceNumber

        baoProductProcess(product, sliceHalfModel, true)
      } else {
        console.error(product, '末尾非数字，匹配清单失败')
      }
    }
  }

  for (let i = 0; i < dList.length; i++) {
    const dItem = dList[i]
    // 获取型号数组
    const pros = dItem[1]

    // 遍历产品
    for (let j = 0; j < pros.length; j++) {
      const product = pros[j]
      const { model, house } = product

      // 给产品增加key
      product.key = randomId()

      // console.log(product)

      if (!model) {
        continue
      }

      // 策略1 存在字符：（包）
      if (model.includes(baoText)) {
        const halfModel = model.slice(0, -3)

        // 包加工
        baoProductProcess(product, halfModel)
      } else {
        // const findPros = pList.filter((p) => p.model.includes(model))
        const findPros = pList.filter((p) => p.model === model)

        if (findPros.length === 0) {
          console.error(product, '匹配清单失败')
          continue
        }

        // 子边界1：匹配多个？
        if (findPros.length > 1) {
          console.warn(product, findPros, '严格匹配，却匹配到多个')
        }

        const onePro = findPros[0]

        // 严格匹配，仅扩展名字
        product.name = onePro.name
        product.orderModel = onePro.model
        product.orderName = onePro.name
        product.sort = onePro.sort
      }
    }
  }

  console.log(dList)

  // 合成数据存入
  const cloneDisProList = cloneDeep(dList)

  console.log(cloneDisProList)

  disProList.value = cloneDisProList

  utilStorage.setDisProList(cloneDisProList)
}

/** 处理销售订单文件夹 */
async function handleOrderFileDirectory() {
  try {
    const { fileList } = directoryObj

    // 遍历解析文件并重新生成
    const processFileList = []
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      const wb = await processFile2Workbook(file)

      const blob = await getWorkbookU8(wb)

      const data = {
        name: file.name,
        blob
      }

      processFileList.push(data)
    }

    console.log(processFileList)

    // 使用jszip 压缩并输出
    const date = dayjs().format('YYYY-MM-DD HH:mm:ss')
    await genDownloadJSZip(processFileList, `${date}-订单批量排序`)
  } catch (e) {
    console.error(e)
    errorToast('存在销售订单 非标准模板，请将其移除或调整')
  }
}

/** 销售订单文件夹 */
async function handleOrderFileDirectoryChange(file) {
  directoryObj.fileList.push(file)

  clearTimeout(directoryObj.timer)

  // 逻辑定时器  500ms
  directoryObj.timer = setTimeout(async () => {
    console.log('文件夹上传完毕', directoryObj.fileList)
    await handleOrderFileDirectory()
    directoryObj.fileList = []
  }, directoryObj.timerDelay)

  return Promise.reject()
}

/** 销售订单 xlsx */
async function handleOrderFileChange(file) {
  console.log(file)
  const filename = file.name

  try {
    const wb = await processFile2Workbook(file)

    await downloadWorkbookJsXlsx(wb, filename)

    message.success('解析成功')

    // 阻止默认行为
    return Promise.reject()
  } catch (e) {
    console.error(e)
    // 当前销售订单，非标准模板
    errorToast('当前销售订单 非标准模板')
  }
}

/** 加工文件返回新工作区 */
async function processFile2Workbook(file) {
  const sheetData = await getSheetData(file)

  // 解析表单
  const excelData = parseSheetData(sheetData)

  // 解析订单数据
  const dpFlatList = getDPFlatList()
  const orderData = parseOrderData(sheetData, excelData, dpFlatList)
  console.log(orderData)

  // 回填模板xlsx
  const wb = await injectTemplateOrderXlsx(orderData)

  return wb
}

/** 货物排序xlsx */
async function handleFile3Change(file) {
  try {
    const sheetData = await getSheetData(file)
    console.log(sheetData)

    // 解析表单
    const excelData = parseSheetData(sheetData)

    // 格式化数据
    const sortList = []
    // 0列为排序，1列为货位号，2列为产品型号
    for (let i = 1; i < excelData.length; i++) {
      const rowItem = excelData[i]

      const sort = rowItem[0]
      const house = rowItem[1]
      const model = rowItem[2]

      const item = {
        sort,
        house,
        model
      }

      sortList.push(item)
    }

    sorList.value = sortList

    console.log(sortList)

    message.success('解析成功')

    /** 数据加工 */
    processDisList()

    // 阻止默认行为
    return Promise.reject()
  } catch (e) {
    console.error(e)
    errorToast(e.message)
  }
}

/** 订单分析 xlsx */
async function handleFile2Change(file) {
  try {
    const sheetData = await getSheetData(file)
    console.log(sheetData)

    // 解析表单
    const excelData = parseSheetData(sheetData)

    // 格式化数据
    const productList = []
    // 0列为产品类别，1列为产品编码，2列为产品名称
    for (let i = 1; i < excelData.length; i++) {
      const rowItem = excelData[i]

      const type = rowItem[0]
      const model = rowItem[1]
      const name = rowItem[2]

      const product = {
        type,
        model,
        name
      }

      productList.push(product)
    }

    console.log(productList)

    proList.value = productList

    message.success('解析成功')

    /** 数据加工 */
    processDisList()

    // 阻止默认行为
    return Promise.reject()
  } catch (e) {
    console.error(e)
    errorToast(e.message)
  }
}

/** 上传货架分布 xlsx */
async function handleFile1Change(file) {
  try {
    const sheetData = await getSheetData(file)

    // 解析表单
    const excelData = parseSheetData(sheetData)

    // 结构化分布数据
    const distributionList = getDistributionData(excelData)
    console.log(distributionList)

    disList.value = distributionList

    message.success('解析成功')

    /** 数据加工 */
    processDisList()

    // 阻止默认行为
    return Promise.reject()
  } catch (e) {
    console.error(e)
    errorToast(e.message)
  }
}

/** 通过 dataList 解析分布数据 */
function getDistributionData(excelData) {
  // 库位+名称数组
  const disMap = new Map()

  // 库位名称正则
  const houseReg = /([A-Z]\d+-[A-Z]\d+)-\d+/

  const l = excelData
  const row = excelData.length
  const col = excelData[0].length

  for (let i = 0; i < row; i++) {
    for (let j = 0; j < col; j++) {
      const v = l[i][j]
      // 如果 v 不存在
      if (!v) {
        continue
      }

      // 如果是库位名
      const matchRs = v.match(houseReg)
      if (matchRs) {
        // 解析键名
        const key = matchRs[1]
        const model = l[i][j + 1] || ''

        const item = {
          house: v,
          model
        }

        const oldList = disMap.get(key) || []
        const wholeList = [...oldList, item]

        disMap.set(key, wholeList)
      }
    }
  }

  // 将其转成数组
  const arr = Array.from(disMap)

  return arr
}
</script>

<style lang="less">
@import './assets/global.less';

.ct {
  padding: 24px;
  padding-bottom: 120px;
}

.tab-table {
  // max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
