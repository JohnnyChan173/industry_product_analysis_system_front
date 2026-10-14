import { defineStore } from "pinia";
import { DataStateData } from "./types";
import { useApi } from "/@/hooks/web/useApi";
import { DictTypeEnums } from "/@/enums/model";
import { dictItemListByDictNo } from "/@/api/dictItem";
import { LineInfo } from "/@/api/model/line";
import { StaffInfo } from "/@/api/model/staff";
import { StationInfo } from "/@/api/model/station";
import { productListAll } from "/@/api/product";
import { materialListAll } from "/@/api/material";
import authStorage from "/@/utils/storage/auth";

const defaultDataState: DataStateData = {
  dictItemMap: {
    [DictTypeEnums.PRODUCT_TYPE]: [],
    [DictTypeEnums.MATERIAL_TYPE]: [],
    [DictTypeEnums.MATERIAL_UNIT]: [],
  },
  productListAll: [],
  materialListAll: [],
};

/** 应用仓库 */
export const useDataStore = defineStore("data", {
  state: () => defaultDataState,
  getters: {
    dictItemProductTypeList: (state) => state.dictItemMap[DictTypeEnums.PRODUCT_TYPE],
    dictItemMaterialTypeList: (state) => state.dictItemMap[DictTypeEnums.MATERIAL_TYPE],
    dictItemMaterialUnitList: (state) => state.dictItemMap[DictTypeEnums.MATERIAL_UNIT],

    productAttrList: (state) => {
      const plList = state.productListAll;
      // 扁平化一级
      const paList = plList.map((i) => i.productAttrList).flat();
      return paList;
    },

    productAttrValueList: (state) => {
      const plList = state.productListAll;
      // 扁平化一级
      const paList = plList.map((i) => i.productAttrList).flat();
      // 扁平化二级
      const pavList = paList.map((i) => i.productAttrValueList).flat();
      return pavList;
    },

    materialSpecsList: (state) => {
      const mlList = state.materialListAll;
      // 扁平化一级
      const specsList = mlList.map((i) => i.materialSpecsList).flat();
      return specsList;
    },
  },
  actions: {
    /** 初始化必要数据 */
    async initData() {
      const token = authStorage.getToken();
      if (token) {
        // 初始化字典数据
        await this.initDictData();

        // 初始化产品列表
        await this.initProductList();

        // 初始化物料列表
        await this.initMaterialList();
      }
    },

    /** 初始化字典数据 */
    async initDictData() {
      // 初始化产品类型
      const dictItemProductTypeList = await this.getDictItemData(DictTypeEnums.PRODUCT_TYPE);
      this.dictItemMap[DictTypeEnums.PRODUCT_TYPE] = dictItemProductTypeList;
      // 初始化物料类型
      const dictItemMaterialTypeList = await this.getDictItemData(DictTypeEnums.MATERIAL_TYPE);
      this.dictItemMap[DictTypeEnums.MATERIAL_TYPE] = dictItemMaterialTypeList;
      // 初始化物料单位
      const dictItemMaterialUnitList = await this.getDictItemData(DictTypeEnums.MATERIAL_UNIT);
      this.dictItemMap[DictTypeEnums.MATERIAL_UNIT] = dictItemMaterialUnitList;
    },

    /** 初始化产品列表 */
    async initProductList() {
      const plList = await productListAll();
      this.productListAll = plList;
    },

    /** 初始化物料列表 */
    async initMaterialList() {
      const mlList = await materialListAll();
      this.materialListAll = mlList;
    },

    /** 获取字典数据 */
    async getDictItemData(dictNo: string, update = false) {
      const { dictItemMap } = this;
      let list = dictItemMap[dictNo];

      // 检测 dictData 数据是否存在，或强制更新
      // console.log(dictNo, list, update);

      if ((list && list.length == 0) || update) {
        list = await dictItemListByDictNo(dictNo);
        dictItemMap[dictNo] = list;
      }

      return list;
    },

    /** 更新字典数据 */
    async updateDictItemData(dictNo: string) {
      const list = this.getDictItemData(dictNo, true);
      return list;
    },

    /** 获取产品信息 */
    getProductInfo(productId: number) {
      const pl = this.productListAll;
      const pi = pl.find((i) => i.id === productId);
      return pi;
    },

    /** 获取产品选项信息 */
    getProductAttrInfo(productAttrId: number) {
      const pal = this.productAttrList;
      const pai = pal.find((i) => i.id === productAttrId);
      return pai;
    },

    /** 获取产品选项值信息 */
    getProductAttrValueInfo(productAttrValueId: number) {
      const pavl = this.productAttrValueList;
      const pavi = pavl.find((i) => i.id === productAttrValueId);
      return pavi;
    },
  },
});
