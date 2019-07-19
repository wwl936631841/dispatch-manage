import { isPlainObject } from '../common/index';
import moment from 'moment';
import './index.less';
import { baseUrl } from '../../unfetch/env';
import { getOption, getOptionState } from '../../unfetch/api';
import React from 'react';
import { Row, Col, Select, Empty, Tag, Modal, Icon, PageHeader } from 'antd';
const { Option } = Select;


class ProcessCaseDetail extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: {},
            processParams: {},
            options: [],
            itemArr: {},
            xxlParams: {},
            selectValue: null,
            val: false,
            title: "",
            visible: false,
        }
    }

    componentWillMount() {
        this.setState({ data: this.props.location.state.data });
        this.setState({ processParams: JSON.parse(this.props.location.state.data.processParams) });
    };

    componentDidMount() {
        // 请求select数据
        this.getOptionMethod();
    }

    handleChange = value => {
        this.setState({ selectValue: value })
        let obj = {};
        obj = this.state.options.find((item) => {
            return item.processNode === value;
        });
        this.getOptionStateMethod(obj);
    }

    getOptionMethod = () => {
        getOption(this.state.data.processInstanceId).then(res => {
            if (res.data.status == 0) {
                this.setState({ options: res.data.data });
                if(!isPlainObject(this.state.data.exceptionNode)){
                    this.state.data.exceptionNode = JSON.parse(this.state.data.exceptionNode);
                }
                for (let i in this.state.data.exceptionNode) {
                    const data = this.state.options.map((item) => {
                        if (item.processNode == i) {
                            item.exception = '#ff8484';
                        }
                        return item;
                    })
                    this.setState({ options: data });
                }
            }
        })
    }

    getOptionStateMethod = data => {
        getOptionState(data).then(res => {
            if (res.data.status == 0) {
                this.setState({ itemArr: res.data.data });
                this.init();
            }
        })
    }
    init = () => {
        if (this.state.data.exceptionNode != null) {
            let err = this.state.data.exceptionNode;
            for (const key in err) {
                if (key == this.state.selectValue) {
                    let a = key;
                    this.setState({ val: true })
                    this.setState({ title: err[a] })
                    break;
                } else {
                    this.setState({ val: false })
                }
            }
        }
    }

    nodeScheduling = () => {
        let dom = "";
        if (this.state.itemArr.xxlParams.handleCode == 1 || this.state.itemArr.xxlParams.handleCode == 200) {
            dom = <Tag color="green">正常</Tag>
        } else if (this.state.itemArr.xxlParams.handleCode == 500) {
            dom = <Tag color="red">异常</Tag>
        }
        return dom;
    }

    nodePerform = () => {
        let dom = "";
        if (!this.state.val) {
            dom = <Tag color="green">正常</Tag>
        } else {
            dom = <Tag color="red">异常</Tag>
        }
        return dom;
    }

    magnifying = () => {
        this.setState({ visible: true })
    }
    
    cancel = () =>{
        this.setState({ visible: false })
    }
    
    back = () =>{
        this.props.history.push('/');
        // this.props.history.goBack()
    }

    render() {
        let optionDate = this.state.options.map(item => {
            return <Option value={item.processNode} style={{ color: item.exception }} key={item.processNode}>{item.processNodeName}</Option>
        })
        // 获取图片地址
        const imgUrl = baseUrl + `/process-schedule/read-resource?processInstanceId=${this.state.data.processInstanceId}`;
        // 获取流程启动参数数据
        let name = null, durationRule = null, periodRule = null, noteRule = null, telRule = null, visitRule = null;
        if (this.state.processParams != null && this.state.processParams.bizVariable.hasOwnProperty("params")) {
            ({ name, durationRule, periodRule, noteRule, telRule, visitRule } = this.state.processParams.bizVariable.params);
        }
        return (
            <div className="process-detail">
                <div className="layout-head"><PageHeader onBack={this.back} title="流程实例" subTitle="流程实例详情"/></div>
                <Modal
                    visible={this.state.visible}
                    footer={null}
                    className="image-magnify-body"
                    width="1600px"
                    onCancel={this.cancel}
                    maskClosable="true"
                >   
                    <img src={imgUrl} />
                </Modal>
                <Row gutter={20}>
                    <Col className="gutter-row" span={18}>
                        <div className="process-detail-picture">
                            <div className="gutter-box image-flex img"><img src={imgUrl} /> <div className="magnify-icon"><Icon type="search" onClick={this.magnifying} /></div></div>
                        </div>
                        <div className="gutter-box process-started analyze-data">
                            <h3 className="process-started-title">
                                获取分析数据<br />
                                <div className="process-select">
                                    <Select style={{ width: 200 }} onChange={this.handleChange} className="analyze-data-select" placeholder="全部">
                                        {optionDate}
                                    </Select>
                                    {
                                        (JSON.stringify(this.state.itemArr) != "{}" && this.state.itemArr.hasOwnProperty('xxlParams')) ?
                                            <div className="process-select__state">
                                                <label>节点调度状态:</label>
                                                {
                                                    this.nodeScheduling()
                                                }
                                                <label>节点执行状态:</label>
                                                {
                                                    this.nodePerform()
                                                }
                                                {
                                                    this.state.val ?
                                                        <div className="process-select__state">
                                                            <label>节点执行异常信息:</label>
                                                                <span className="process-state">{this.state.title}</span>
                                                        </div> : ""
                                                }

                                            </div>
                                            :
                                            ""
                                    }

                                </div>
                            </h3>
                            {
                                (JSON.stringify(this.state.itemArr) != "{}" && this.state.itemArr.hasOwnProperty('xxlParams')) ?
                                    <div className="analyze-data-content">
                                        <h4>调度参数</h4>
                                        <div className="analyze-data">
                                            <div className="analyze-data-item">
                                                <div className="analyze-data-item__con align-center">
                                                    <label>执行器地址:</label>
                                                    <div>{this.state.itemArr.xxlParams.executorAddress}</div>
                                                </div>
                                                <div className="analyze-data-item__con align-center">
                                                    <label>jobHandle:</label>
                                                    <div>{this.state.itemArr.xxlParams.executorHandler}</div>
                                                </div>
                                                <div className="analyze-data-item__con align-top">
                                                    <label>任务参数:</label>
                                                    <div>{JSON.stringify(this.state.itemArr.xxlParams.executorParam)}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <h4> 调度结果日志 &nbsp;
                                            {
                                                this.state.itemArr.xxlParams.handleCode == 1 ? <Tag color="green">成功</Tag> : <Tag color="red">失败</Tag>
                                            }
                                        </h4>
                                        <div className="analyze-data">
                                            <div className="analyze-data-item">
                                                {this.state.itemArr.xxlParams.handleMsg}
                                            </div>
                                        </div>
                                        <h4>执行日志</h4>
                                        <div className="analyze-data">
                                            <div className="analyze-data-item">
                                                ---------- xxl-job job execute strat ----------<br />
                                                ---------- <span>param:</span>{JSON.stringify(this.state.itemArr.xxlParams.executorParam)}<br />
                                                {moment(this.state.itemArr.xxlParams.handleTime).format('YYYY-MM-DD HH:mm:ss')}<br />
                                                ---------- xxl-job job execute end(finish) ----------<br />
                                                ---------- <span>ReturnT:</span>ReturnT [ code={this.state.itemArr.xxlParams.handleCode} , msg={this.state.itemArr.xxlParams.handleMsg} ]
                                            </div>
                                        </div>
                                    </div>
                                    :
                                    <div className="analyze-data-content">
                                        <Empty description="请选择节点" />
                                    </div>
                            }
                        </div>
                    </Col>
                    <Col className="gutter-row" span={6}>
                        <div className="gutter-box process-started process-started1">
                            <h3 className="process-started-title">流程启动参数</h3>
                            <div className="process-started-list">
                                <div>催缴模板</div>
                                <div>{name || '-'}</div>
                            </div>
                            <div className="process-started-list">
                                <div>欠费时长</div>
                                <div>{durationRule ? `欠费${durationRule}个月起开始催缴` : '-'}</div>
                            </div>
                            <div className="process-started-list">
                                <div>催缴周期</div>
                                <div>{periodRule ? `${periodRule}个月` : '-'}</div>
                            </div>
                            <div className="process-started-list">
                                <div>短信催缴</div>
                                <div>{noteRule ? `欠费${noteRule}个月起开启短信自动发送催缴` : '-'}</div>
                            </div>
                            <div className="process-started-list">
                                <div>电话催缴</div>
                                <div>{telRule ? `欠费${telRule}个月起开启电话催缴` : '-'}</div>
                            </div>
                            <div className="process-started-list">
                                <div>上门催缴</div>
                                <div> {visitRule ? `欠费${visitRule}个月起开启上门催缴` : '-'}</div>
                            </div>
                        </div>
                        <div className="gutter-box process-started">
                            <h3 className="process-started-title">流程启动参数</h3>
                            <div className="process-started-content">
                                {this.state.data.processParams}
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>
        );
    }
}
export default ProcessCaseDetail;
