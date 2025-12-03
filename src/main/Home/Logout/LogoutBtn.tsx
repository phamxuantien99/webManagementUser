import React, { useContext } from "react";
import { BsBoxArrowRight } from "react-icons/bs";
import { useLocation, useNavigate } from "react-router-dom";
import AuthContext, { AuthContextType } from "../../context/AuthProvider";

const LogoutBtn = () => {
  const navigation = useNavigate();
  const { setIsLoggedIn, setUserInfo } = useContext(
    AuthContext
  ) as AuthContextType;

  const location = useLocation();
  const _handleLogout = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    setIsLoggedIn(false);
    localStorage.removeItem("access_token_installation");
    setUserInfo(null);
    // window.location.reload();
    navigation("/", { replace: true, state: { from: location } });
  };
  return (
    <button
      className="btn btn-ghost btn-circle"
      onClick={(e) => _handleLogout(e)}
    >
      <BsBoxArrowRight size={24} />
    </button>
  );
};

export default LogoutBtn;
