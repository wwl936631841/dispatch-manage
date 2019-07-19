import { CLEAR_LIST_STATE, LIST_STATE } from "../actionTypes";
const initListState = {
    listData: [],//列表数据
    total: 0,
    filterDate: {
        startTime: null,
        endTime: null,
        processStatus: null,
        processName: "",
        createId: null
    },
}
const redListState = (state = initListState, action) => {
    if (action === undefined) {
        return state
    }
    switch (action.type) {
        case LIST_STATE:
            //更新列表状态
            return {
                ...state,
                ...action
            }
        case CLEAR_LIST_STATE:
            //清空列表状态
            return initListState
        default:
            return state
    }
}
export default redListState