import React, { CSSProperties, Suspense, useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { FadeLoader } from "react-spinners";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import withAuth from "./main/com/RequiredAuth";

const HomeComponent = React.lazy(() => import("./main/Home/Home"));
// Admin
const AdminComponent = React.lazy(
  () => import("./main/Home/AdminComponent/AdminComponent")
);
const GroupPermission = React.lazy(
  () => import("./main/Home/AdminComponent/GroupPermission/GroupPermission")
);
const GetListPermissions = React.lazy(
  () =>
    import("./main/Home/AdminComponent/GetListPermissions/GetListPermissions")
);

// Login
const Login = React.lazy(() => import("./main/Login/Login"));
// Dashboard
const Dashboard = React.lazy(() => import("./main/Home/Dashboard/Dashboard"));
// Project Management
const ProjectManagement = React.lazy(
  () => import("./main/Home/ProjectManagement/ProjectManagement")
);
// Work Process Tracking
const WorkProcessTracking = React.lazy(
  () => import("./main/Home/WorkProcessTracking/WorkProcessTracking")
);
// Project Delivery Order
const ProjectDeliveryOrder = React.lazy(
  () => import("./main/Home/ProjectDeliveryOrder/ProjectDeliveryOrder")
);
// Files
const Files = React.lazy(() => import("./main/Home/Files/Files"));

const override: CSSProperties = {
  display: "flex",
  margin: "50px auto",
  borderColor: "red",
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token_installation");
    const expiration = localStorage.getItem("expiration_installation");

    if (
      token &&
      expiration &&
      new Date(expiration) > new Date() &&
      location.pathname === "/"
    ) {
      navigate("/home/dashboard");
    }
  }, [navigate, location.pathname]);

  // bọc với auth
  const ProtectedHome = withAuth(HomeComponent);
  const ProtectedAdmin = withAuth(AdminComponent);
  const ProtectedGroupPermission = withAuth(GroupPermission);
  const ProtectedGetListPermissions = withAuth(GetListPermissions);
  const ProtectedDashboard = withAuth(Dashboard);
  const ProtectedProjectManagement = withAuth(ProjectManagement);
  const ProtectedWorkProcessTracking = withAuth(WorkProcessTracking);
  const ProtectedProjectDeliveryOrder = withAuth(ProjectDeliveryOrder);
  const ProtectedFiles = withAuth(Files);

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Home layout */}
        <Route path="/home" element={<ProtectedHome />}>
          {/* Các route con nằm trong <Outlet /> */}
          <Route
            path="dashboard"
            element={
              <Suspense
                fallback={
                  <div style={{ textAlign: "center", marginTop: "50px" }}>
                    <FadeLoader cssOverride={override} color="red" />
                  </div>
                }
              >
                <ProtectedDashboard />
              </Suspense>
            }
          />
          <Route
            path="projectmanagement"
            element={
              <Suspense
                fallback={
                  <div style={{ textAlign: "center", marginTop: "50px" }}>
                    <FadeLoader cssOverride={override} color="red" />
                  </div>
                }
              >
                <ProtectedProjectManagement />
              </Suspense>
            }
          />
          <Route
            path="tracking"
            element={
              <Suspense
                fallback={
                  <div style={{ textAlign: "center", marginTop: "50px" }}>
                    <FadeLoader cssOverride={override} color="red" />
                  </div>
                }
              >
                <ProtectedWorkProcessTracking />
              </Suspense>
            }
          />
          <Route
            path="deliveryorder"
            element={
              <Suspense
                fallback={
                  <div style={{ textAlign: "center", marginTop: "50px" }}>
                    <FadeLoader cssOverride={override} color="red" />
                  </div>
                }
              >
                <ProtectedProjectDeliveryOrder />
              </Suspense>
            }
          />
          <Route
            path="files"
            element={
              <Suspense
                fallback={
                  <div style={{ textAlign: "center", marginTop: "50px" }}>
                    <FadeLoader cssOverride={override} color="red" />
                  </div>
                }
              >
                <ProtectedFiles />
              </Suspense>
            }
          />

          {/* Admin và các route con */}
          <Route
            path="admin"
            element={
              <Suspense
                fallback={
                  <div style={{ textAlign: "center", marginTop: "50px" }}>
                    <FadeLoader cssOverride={override} color="red" />
                  </div>
                }
              >
                <ProtectedAdmin />
              </Suspense>
            }
          />
          <Route
            path="admin/groupPermission"
            element={
              <Suspense
                fallback={
                  <div style={{ textAlign: "center", marginTop: "50px" }}>
                    <FadeLoader cssOverride={override} color="red" />
                  </div>
                }
              >
                <ProtectedGroupPermission />
              </Suspense>
            }
          />
          <Route
            path="admin/getListPermissions"
            element={
              <Suspense
                fallback={
                  <div style={{ textAlign: "center", marginTop: "50px" }}>
                    <FadeLoader cssOverride={override} color="red" />
                  </div>
                }
              >
                <ProtectedGetListPermissions />
              </Suspense>
            }
          />
        </Route>
      </Routes>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;
