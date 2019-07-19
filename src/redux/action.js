/**
 * Created by liying on 2019/7/8
 * Desc: 列表数据缓存
 */
import {CLEAR_LIST_STATE, LIST_STATE} from "./actionTypes";
import store from './store'

/**
 * 保存列表状态
 * @param data
 * @returns {Function}
 */
export const saveListState = (data) => {
    return () => {
        store.dispatch({
            type: LIST_STATE,
            ...data
        })
    }
}

/**
 * 清除列表状态
 * @returns {Function}
 */
export const clearListState = () => {
    return () => {
        store.dispatch({
            type: CLEAR_LIST_STATE
        })
    }
}