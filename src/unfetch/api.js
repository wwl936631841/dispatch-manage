import service from './unfetch'

// 流程实例日志列表
export const getProcesses = data => {
    return service({
        url: '/process-schedule/page',
        method: 'post',
        data
    })
};

// 获取数据分析选项
export const getOption = data => {
    return service({
        url: `/process-schedule/queryNodeList?processInstanceId=${data}`,
        method: 'get',
        data
    })
};

// 获取对应选项的数据
export const getOptionState = data => {
    return service({
        url: `/process-schedule/queryProcessScheduleList?processInstanceId=${data.processInstanceId}&processNode=${data.processNode}`,
        method: 'get',
        data
    })
};

