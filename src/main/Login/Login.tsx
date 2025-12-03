import React, { useContext, useRef, useState } from "react";
import { BsFillEyeFill, BsFillEyeSlashFill } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import apiAxios from "../../api/api";
import logo2 from "../../assets/images/logo2.png";
import backgroundImage from "../../assets/images/backgroud.png";
import AuthContext, { AuthContextType } from "../context/AuthProvider";
import { api } from "../service/api/endpoint";

const Login = () => {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useContext(AuthContext) as AuthContextType;
  const loginFormRef = useRef(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    apiAxios
      .post(api.getLogin, {
        user_name: username,
        password: password,
      })
      .then((res) => {
        const accessToken = res.data.access_token;
        localStorage.setItem("access_token_installation", accessToken);
        localStorage.setItem("expiration_installation", res.data.expiration);
        localStorage.setItem(
          "refresh_token_installation",
          res.data.refresh_token
        );
        localStorage.setItem(
          "expiration_refresh_token_installation",
          res.data.expiration_refresh_token
        );

        localStorage.setItem("username", res.data.user_info.user_name);
        localStorage.setItem("is_superuser", res.data.user_info.is_superuser);

        setIsLoggedIn(true);
        navigate("/home/dashboard");
      })
      .catch((e) => {
        setIsLoggedIn(false);
        switch (e.response.status) {
          case 401:
            alert("Unauthorized");
            break;
          case 403:
            alert("Username or password is incorrect");
            break;
          default:
            alert("Something went wrong, please try again.");
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-100 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src={backgroundImage} // thay ảnh bạn muốn
          alt="Background"
          className="w-full h-full object-cover "
        />
      </div>

      {/* Foreground content */}
      <div className="relative z-10 flex flex-col m-6 space-y-8 bg-white shadow-2xl rounded-2xl md:flex-row md:space-y-0">
        {/* Left side (form) */}
        <form ref={loginFormRef} onSubmit={handleLogin}>
          <div className="flex flex-col justify-center p-8 md:p-14">
            <span className="mb-3 text-4xl font-bold text-[#0d75be]">
              Management Account Web
            </span>
            <span className=" text-[#27b771] mb-8">
              Welcome back! Please enter your details
            </span>

            {/* Username */}
            <div className="py-4">
              <span className="block text-gray-700 text-lg font-bold mb-2">
                Username
              </span>
              <input
                className="w-full p-2 border border-gray-300 rounded-md placeholder:font-light placeholder:text-gray-500"
                name="email"
                id="email"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                type="text"
                placeholder="Username"
              />
            </div>

            {/* Password */}
            <div className="py-4">
              <span className="block text-gray-700 text-lg font-bold mb-2">
                Password
              </span>
              <div className="flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  className="input input-bordered w-full"
                />
                <div
                  className="btn btn-square ml-2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <BsFillEyeFill /> : <BsFillEyeSlashFill />}
                </div>
              </div>
            </div>

            <button
              className={`btn btn-primary ${loading && "loading"}`}
              disabled={loading || !!!username || !!!password}
              type="submit"
            >
              Sign in
            </button>
          </div>
        </form>

        {/* Right side (logo) */}
        <div className="relative flex justify-center items-center">
          <img className="w-[500px]" src={logo2} alt="logo" />
        </div>
      </div>
    </div>
  );
};

export default Login;
