/* eslint-disable jsx-a11y/alt-text */
import React, { useState, Suspense } from "react";
import {
  DesktopOutlined,
  FileOutlined,
  LogoutOutlined,
  PieChartOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Layout, Menu, theme } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { FadeLoader } from "react-spinners";
import "./style.css";

const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem("Dashboard", "1", <PieChartOutlined />),
  getItem("Project Management", "6", <PieChartOutlined />),
  getItem("Work Process Tracking", "2", <DesktopOutlined />),
  getItem("Project Delivery Order", "5", <FileOutlined />),
  getItem("User Management", "3", <UserOutlined />),
  getItem("Files", "4", <FileOutlined />),
  getItem("Logout", "0", <LogoutOutlined />),
];

const Home: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const navigate = useNavigate();
  const location = useLocation();

  // Ánh xạ path -> key trong menu
  const pathKeyMap: Record<string, string> = {
    "/home/dashboard": "1",
    "/home/projectmanagement": "6",
    "/home/tracking": "2",
    "/home/deliveryorder": "5",
    "/home/admin": "3",
    "/home/admin/groupPermission": "3",
    "/home/admin/getListPermissions": "3",
    "/home/files": "4",
  };

  // Xác định key hiện tại từ path
  const currentKey = pathKeyMap[location.pathname] || "1";

  const onClick: MenuProps["onClick"] = (e) => {
    switch (e.key) {
      case "1":
        navigate("/home/dashboard");
        break;
      case "2":
        navigate("/home/tracking");
        break;
      case "3":
        navigate("/home/admin");
        break;
      case "4":
        navigate("/home/files");
        break;
      case "5":
        navigate("/home/deliveryorder");
        break;
      case "6":
        navigate("/home/projectmanagement");
        break;
      case "0":
        localStorage.clear();
        navigate("/");
        break;
      default:
        break;
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={220}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
      >
        <div className="logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
          items={items}
          onClick={onClick}
          selectedKeys={[currentKey]}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: "5px" }}>
          {/* Suspense chỉ bọc Outlet để loading hiển thị bên phải */}
          <Suspense
            fallback={
              <div style={{ textAlign: "center", marginTop: "50px" }}>
                <FadeLoader color="red" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          Delta Tech ©2023 Created by DTV
        </Footer>
      </Layout>
    </Layout>
  );
};

export default Home;
