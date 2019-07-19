import React from 'react';
import { Form, Input, Button, DatePicker, Select } from 'antd';
import moment from 'moment';
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

class HorizontalLoginForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            options: [
                {
                    value: null,
                    label: '全部'
                },
                {
                    value: 1,
                    label: '启动中'
                },
                {
                    value: 2,
                    label: '已完结'
                }
            ],
        }
    }
    componentDidMount() {
        this.props.form.validateFields();
    }

    onFilterValue(obj) {
        // 传递搜索条件给父组件
        this.props.onFilterValue(obj);
    };

    handleSubmit = e => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (values.times != undefined && values.times.length) {
                values.startTime = moment(values.times[0]).format('YYYY-MM-DD HH:mm:ss');
                values.endTime = moment(values.times[1]).format('YYYY-MM-DD HH:mm:ss');
            }else{
                values.startTime = null;
                values.endTime = null;
            }
            this.onFilterValue(values);
        });
    };

    render() {
        const SelectState = this.state.options.map((item) => {
            return <Option value={item.value} key={item.value}>{item.label}</Option>
        })
        const { getFieldDecorator } = this.props.form;
        return (
            <Form layout="inline" onSubmit={this.handleSubmit}>
                <Form.Item>
                    {getFieldDecorator('processName',{
                        initialValue: this.props.filterDate.processName 
                    })(
                        <Search placeholder="流程名称" />,
                    )}
                </Form.Item>
                <Form.Item>
                    {getFieldDecorator('times',{
                        initialValue: this.props.filterDate.times 
                    })(
                        <RangePicker
                            showTime={{ format: 'HH:mm:ss' }}
                            placeholder={['开始日期', '结束日期']}
                        />
                    )}
                </Form.Item>
                <Form.Item>
                    {getFieldDecorator('createId',{
                        initialValue: this.props.filterDate.createId 
                    })(
                        <Search placeholder="操作人" />,
                    )}
                </Form.Item>
                <Form.Item>
                    {getFieldDecorator('processStatus',{
                        initialValue: this.props.filterDate.processStatus 
                    })(
                        <Select style={{ width: 120 }} placeholder="流程状态" allowClear={true} >
                            {SelectState}
                        </Select>
                    )}
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">Search</Button>
                </Form.Item>
            </Form>
        );
    }
}
const FilterForm = Form.create({ name: 'horizontal_login' })( HorizontalLoginForm );
export default FilterForm;