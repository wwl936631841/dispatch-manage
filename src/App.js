import { clearListState } from './redux/action';
import './App.css';
import React from 'react';
import { BrowserRouter, Route , Link } from 'react-router-dom';
import ProcessCase from './page/processCase/index';
import processCaseDetail from './page/processCaseDetail/index';
import { Menu, Icon } from 'antd';
const { SubMenu } = Menu;

class App extends React.Component {
  state = {
    collapsed: false,
  };
  toggleCollapsed = () => {
    this.setState({
      collapsed: !this.state.collapsed,
    });
  };
  menuClick = () => {
    clearListState()();
  }
  render() {
    return (
      <div className="layout">
        <BrowserRouter>
            <div style={{ width: 240 }}>
                <div className="menu-brand"><span>保臻科技调度平台</span></div>
                <div className="menu-container">
                  <Menu
                    defaultSelectedKeys={['/']}
                    defaultOpenKeys={['sub1']}
                    mode="inline"
                    theme="dark"
                    inlineCollapsed={this.state.collapsed}
                    onClick={this.menuClick}
                  >
                    <SubMenu
                      key="sub1"
                      title={
                        <span>
                            <Icon type="flag" />
                            <span>流程实例管理</span>
                          </span>
                      }
                    >
                      <Menu.Item key="/"><Link to="/">流程实例管理 </Link></Menu.Item>
                    </SubMenu>
                  </Menu>
                </div>
            </div>
            <div className="layout-content">
                <div className="layout-main">
                  <Route exact path="/" cache  component={ ProcessCase }></Route>
                  <Route exact path="/processCaseDetail" component={ processCaseDetail }></Route>
                </div>
            </div>
        </BrowserRouter>
      </div>
    );
  }
}
export default App;
