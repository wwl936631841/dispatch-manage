
import React from 'react';
import { getProcesses } from '../../unfetch/api';
import { Table, Tag, Tooltip, PageHeader } from 'antd';
import moment from 'moment'
import { connect } from "react-redux";
import FilterForm from './form.js';
import { saveListState } from '../../redux/action';
import './index.less';

class ProcessCase extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dataSource: {},
            filterDate: {
                pageNo: 1,
                pageSize: 11,
                startTime: null,
                endTime: null,
                processStatus: null,
                processName: "",
                createId: null
            },
            loading: false
        }
    }
    
    componentWillMount() {
        if (this.props.listState && this.props.listState.listData.length) {
            this.setState({
                dataSource: {
                    records: this.props.listState.listData,
                    total: this.props.listState.total,
                },
                loading: false,
            })
            this.state.filterDate = Object.assign(this.state.filterDate, this.props.listState.filterDate);
        } else {
            this.getTableData();
        }
    };

    getTableData() {
        this.setState({ loading: true });
        getProcesses(this.state.filterDate).then(res => {
            if (res.data.status == 0) {
                this.setState({ 
                    dataSource: res.data.data,
                    loading: false
                });
            }
        })
    };

    onChildChange = (obj) => {
        this.state.filterDate.pageNo = 1;
        this.state.filterDate = Object.assign(this.state.filterDate, obj);
        for (let i in this.state.filterDate) {
            if (this.state.filterDate[i] == "" || this.state.filterDate[i] == undefined) {
                this.state.filterDate[i] = null;
                if (i == 'processName') {
                    this.state.filterDate['processName'] = "";
                }
            }
        }
        this.getTableData();
    }

    changePage = (page) => {
        this.state.filterDate.pageNo = page;
        this.getTableData();
    }
    viewDetail = (record) => {
        // 缓存
        saveListState({
            listData: this.state.dataSource.records,
            total: this.state.dataSource.total,
            filterDate: this.state.filterDate
        })();
        this.props.history.push({ pathname: '/processCaseDetail', state: { data: record } })
    }
    render() {
        const columns = [
            {
                title: '流程名称',
                dataIndex: 'name',
                key: 'name',
                fixed: 'left',
                width: 150,
            },
            {
                title: '流程类型',
                dataIndex: 'processMonth1',
                key: 'processMonth1',
                fixed: 'left',
                width: 100,
            },
            {
                title: '流程月份',
                dataIndex: 'processMonth',
                key: 'processMonth',
            },
            {
                title: '流程状态',
                dataIndex: 'processStatus',
                key: 'processStatus',
                render: text => {
                    return (
                        text == 1 ? <Tag color="orange">启动中</Tag> : <Tag color="#CBCBCB">已完结</Tag>
                    )
                }
            },
            {
                title: '流程模板ID',
                dataIndex: 'procDefId',
                key: 'procDefId',
                render: text => {
                    return (
                        <Tooltip title={text} placement="bottom">
                            <div className="exception-node">{text}</div>
                        </Tooltip>
                    )
                }
            },
            {
                title: '流程实例ID',
                dataIndex: 'processInstanceId',
                key: 'processInstanceId',
                render: text => {
                    return (
                        <Tooltip title={text} placement="bottom">
                            <div className="exception-node">{text}</div>
                        </Tooltip>
                    )
                }
            },
            {
                title: '操作人',
                dataIndex: 'createId',
                key: 'createId',
            },
            {
                title: '更新人',
                dataIndex: 'updateId',
                key: 'updateId',
            },
            {
                title: '是否异常',
                dataIndex: 'processException',
                key: 'processException',
                render: text => {
                    return (
                        text == 0 ? <Tag color="green">正常</Tag> : <Tag color="red">异常</Tag>
                    )
                }
            },
            {
                title: '异常节点信息',
                dataIndex: 'exceptionNode',
                key: 'exceptionNode',
                render: text => {
                    if (!text) return "";
                    return (
                        <Tooltip title={JSON.stringify(text)} placement="bottom">
                            <div className="exception-node">{JSON.stringify(text)}</div>
                        </Tooltip>
                    )
                }
            },
            {
                title: '更新时间',
                dataIndex: 'updateTime',
                key: 'updateTime',
                render: text => {
                    return (
                        <div>{moment(text).format('YYYY-MM-DD HH:mm:ss')}</div>
                    )
                }
            },
            {
                title: '创建时间',
                dataIndex: 'createTime',
                key: 'createTime',
                render: text => {
                    return (
                        <div>{moment(text).format('YYYY-MM-DD HH:mm:ss')}</div>
                    )
                }
            },
            {
                title: '操作',
                key: 'operation',
                fixed: 'right',
                render: (text, record) => {
                    return <a onClick={() => this.viewDetail(record)}>查看</a>
                }

            },
        ];
        return (
            <div className="process-case">
                <div className="layout-head"><PageHeader title="流程实例日志" /></div>
                <div className="process-form">
                    <FilterForm onFilterValue={this.onChildChange} filterDate={this.state.filterDate}></FilterForm>
                </div>
                <Table
                    pagination={{
                        current: this.state.filterDate.pageNo,
                        total: this.state.dataSource.total,
                        onChange: this.changePage,
                        pageSize: 11
                    }}
                    bordered
                    dataSource={this.state.dataSource.records}
                    simple
                    columns={columns}
                    className="table"
                    rowKey={record => record.processInstanceId}
                    loading={this.state.loading}
                    scroll={{ x: 1970 }} />
            </div>
        );
    }
}
let mapStateToProps = (state) => ({
    listState: { ...state.redListState }
})

let mapDispatchToProps = (dispatch) => ({})
export default connect(mapStateToProps, mapDispatchToProps)(ProcessCase)
// export default ProcessCase;
