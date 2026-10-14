import { isRef, Ref, unref } from "vue";

type DataList<T> = Ref<any[]> | any[];

function _returnData(l1: DataList<any>, l2: any[]) {
  // if (isRef(l1)) {
  //   l1.value = l2;
  //   return l2;
  // } else {
  return l2;
  // }
}

export function useDataUtils() {
  function addListItem<T>(list: DataList<T>, value: any) {
    const l1 = unref(list);
    const l2 = [...l1, value];
    return _returnData(l1, l2) as T[];
  }

  function removeListItemWithKey<T>(list: DataList<T>, key: any, keyName: string = "id") {
    const l1 = unref(list);
    const l2 = l1.filter((i) => i[keyName] !== key);
    return _returnData(l1, l2) as T[];
  }

  function removeListItemWithIndex<T>(list: DataList<T>, index: number) {
    const l1 = unref(list);
    const l2 = l1.slice().splice(index, 1);

    return _returnData(l1, l2) as T[];
  }

  function editListItemWithKey<T>(list: DataList<T>, key: any, value: any, keyName: string = "id") {
    const l1 = unref(list);
    const l2 = l1.slice();
    const index = l2.findIndex((i) => i[keyName] === key);
    l2.splice(index, 1, value);

    return _returnData(l1, l2) as T[];
  }

  return {
    addListItem,
    removeListItemWithKey,
    removeListItemWithIndex,
    editListItemWithKey,
  };
}
