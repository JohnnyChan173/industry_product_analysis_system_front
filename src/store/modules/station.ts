import { defineStore } from "pinia";
import { ref, computed } from 'vue'


export const useStationStore = defineStore('station',() => {
  const stationList = ref<number[]>([])
  /** 设置工位列表 */
  function setStationList(list: number[]) {
    stationList.value = list;
  }
  return {
    stationList,
    setStationList
  }
})
