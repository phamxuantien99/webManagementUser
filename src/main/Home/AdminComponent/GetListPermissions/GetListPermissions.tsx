import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import apiAxios from "../../../../api/api";
import { useDebounce } from "../../../service/hooks/useDebounce";

interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description: string;
  endpoint: string;
  method: string;
}

const API_URL = "https://ec2api.deltatech-backend.com/api/v1/permissions";

const PermissionPage: React.FC = () => {
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // 🔹 Lấy giá trị filter từ URL
  const resource = searchParams.get("resource") || "";
  const action = searchParams.get("action") || "";
  const name = searchParams.get("name") || "";
  const description = searchParams.get("description") || "";
  const endpoint = searchParams.get("endpoint") || "";
  const method = searchParams.get("method") || "";

  const [formData, setFormData] = useState<Omit<Permission, "id">>({
    name: "",
    resource: "",
    action: "",
    description: "",
    endpoint: "",
    method: "",
  });

  const [openDialog, setOpenDialog] = useState(false);

  // 🔹 URL động dựa theo filter
  const queryUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (resource) params.append("resource", resource);
    if (action) params.append("action", action);
    if (name) params.append("name", name);
    if (description) params.append("description", description);
    if (endpoint) params.append("endpoint", endpoint);
    if (method) params.append("method", method);
    return `${API_URL}?${params.toString()}`;
  }, [resource, action, name, description, endpoint, method]);

  // 🔹 Lấy danh sách Permission
  const { data: permissions = [], isLoading } = useQuery<Permission[]>({
    queryKey: ["permissions", queryUrl],
    queryFn: async () => {
      const res = await apiAxios.get(queryUrl);
      return res.data;
    },
  });

  // --- 2️⃣ Thêm state local ---
  // --- 2️⃣ State local ---
  const [inputs, setInputs] = useState({
    name,
    description,
    endpoint,
    method,
  });

  // --- 3️⃣ Debounce toàn bộ object ---
  const debouncedInputs = useDebounce(inputs, 500);

  // --- 4️⃣ Cập nhật URL sau khi debounce ổn định ---
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    let hasChanged = false;

    // Lặp qua từng field để cập nhật param tương ứng
    Object.entries(debouncedInputs).forEach(([key, value]) => {
      const current = searchParams.get(key) || "";
      if (value !== current) {
        hasChanged = true;
        if (value) newParams.set(key, value);
        else newParams.delete(key);
      }
    });

    // Chỉ update nếu thực sự có thay đổi
    if (hasChanged) setSearchParams(newParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInputs]);

  // --- 5️⃣ Hàm helper onChange ---
  const handleChangeSearchInput =
    (field: keyof typeof inputs) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputs((prev) => ({ ...prev, [field]: e.target.value }));
    };

  // Mutation Delete

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const mutationDelete = useMutation({
    mutationFn: async (id: number) => {
      setDeletingId(id); // Ghi nhớ ID đang bị xóa
      await apiAxios.delete(
        `https://ec2api.deltatech-backend.com/api/v1/permissions/${id}`
      );
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      toast.success("Permission deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete permission.");
    },
    onSettled: () => {
      setDeletingId(null); // Reset sau khi xóa xong hoặc lỗi
    },
  });
  // 🔹 Cập nhật URL khi thay đổi filter
  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    setSearchParams(newParams);
  };

  // 🔹 Lưu lỗi của từng trường
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 🔹 Mutation thêm mới
  const mutation = useMutation({
    mutationFn: async (newPermission: Omit<Permission, "id">) => {
      const params = new URLSearchParams(newPermission as any).toString();
      await apiAxios.post(`${API_URL}?${params}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      toast.success("Permission added successfully!");
      setFormData({
        name: "",
        resource: "",
        action: "",
        description: "",
        endpoint: "",
        method: "",
      });
      setErrors({});
      setOpenDialog(false);
    },
    onError: (error: any) => {
      console.error("Create Permission Error:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to add permission.");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // 🔹 Xóa lỗi khi người dùng bắt đầu nhập lại
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    const requiredFields = ["name", "resource", "action"];

    requiredFields.forEach((field) => {
      if (!formData[field as keyof typeof formData].trim()) {
        newErrors[field] = "This field is required";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // ❌ Dừng lại nếu có lỗi
    }

    mutation.mutate(formData);
  };

  const handleCloseDialog = () => {
    setErrors({}); // 🔹 Xóa toàn bộ lỗi
    setFormData({
      name: "",
      resource: "",
      action: "",
      description: "",
      endpoint: "",
      method: "",
    }); // (tùy chọn: reset form)
    setOpenDialog(false);
  };

  return (
    <div className="mt-4 mx-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/home/admin/groupPermission")}
            className="px-3 py-2 bg-[#1976d2] text-white rounded-md hover:bg-[#27b771] transition"
          >
            <ArrowBackIcon />
          </button>

          <Typography variant="h4" gutterBottom>
            Permissions Management
          </Typography>
        </div>

        <button
          onClick={() => setOpenDialog(true)}
          className="px-2 py-5 bg-[#1976d2] text-white rounded-md hover:bg-[#27b771] transition duration-300 ease-in-out min-w-[120px]"
        >
          + Add
        </button>
      </div>

      {/* 🔹 Bảng dữ liệu + Bộ lọc trong header */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            {/* Tiêu đề cột */}
            <TableRow>
              <TableCell sx={{ width: "5%" }}>
                <strong>No.</strong>
              </TableCell>
              <TableCell sx={{ width: "15%" }}>
                <strong>Name</strong>
              </TableCell>
              <TableCell sx={{ width: "15%" }}>
                <strong>Resource</strong>
              </TableCell>
              <TableCell sx={{ width: "15%" }}>
                <strong>Action</strong>
              </TableCell>
              <TableCell sx={{ width: "17.5%" }}>
                <strong>Description</strong>
              </TableCell>
              <TableCell sx={{ width: "17.5%" }}>
                <strong>Endpoint</strong>
              </TableCell>
              <TableCell sx={{ width: "10%" }}>
                <strong>Method</strong>
              </TableCell>
              <TableCell sx={{ width: "5%" }}>
                <strong>Delete</strong>
              </TableCell>
            </TableRow>

            {/* Hàng filter ngay bên dưới tiêu đề */}
            <TableRow>
              <TableCell></TableCell>

              {/* Filter Name */}
              <TableCell>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search Name"
                  value={inputs.name}
                  onChange={handleChangeSearchInput("name")}
                />
              </TableCell>

              {/* Filter Resource */}
              <TableCell>
                <Select
                  fullWidth
                  size="small"
                  displayEmpty
                  value={resource}
                  onChange={(e) =>
                    handleFilterChange("resource", e.target.value)
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  {[
                    "user",
                    "installation",
                    "measurement",
                    "logistic",
                    "invoice",
                  ].map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </Select>
              </TableCell>

              {/* Filter Action */}
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  <Select
                    fullWidth
                    size="small"
                    displayEmpty
                    value={action}
                    onChange={(e) =>
                      handleFilterChange("action", e.target.value)
                    }
                  >
                    <MenuItem value="">All</MenuItem>
                    {["create", "read", "update", "delete"].map((a) => (
                      <MenuItem key={a} value={a}>
                        {a}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              </TableCell>

              {/* Filter description */}
              <TableCell>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search Description"
                  value={inputs.description}
                  onChange={handleChangeSearchInput("description")}
                />
              </TableCell>

              {/* Filter endpoint */}
              <TableCell>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search Endpoint"
                  value={inputs.endpoint}
                  onChange={handleChangeSearchInput("endpoint")}
                />
              </TableCell>

              {/* Filter method */}
              <TableCell>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search Method"
                  value={inputs.method}
                  onChange={handleChangeSearchInput("method")}
                />
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  align="center"
                  className=" !text-red-500"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : permissions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  align="center"
                  className=" !text-red-500"
                >
                  No Results Found !!
                </TableCell>
              </TableRow>
            ) : (
              permissions.map((perm, index) => (
                <TableRow key={perm.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{perm.name}</TableCell>
                  <TableCell>{perm.resource}</TableCell>
                  <TableCell>{perm.action}</TableCell>
                  <TableCell>{perm.description}</TableCell>
                  <TableCell>{perm.endpoint}</TableCell>
                  <TableCell>{perm.method}</TableCell>
                  <TableCell>
                    <IconButton
                      color="error"
                      onClick={() => mutationDelete.mutate(perm.id)}
                      disabled={deletingId === perm.id}
                    >
                      {deletingId === perm.id ? (
                        <CircularProgress size={20} color="error" />
                      ) : (
                        <DeleteIcon />
                      )}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 🔹 Dialog thêm mới */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Permission</DialogTitle>

        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {Object.keys(formData).map((key) => {
              const label = key.charAt(0).toUpperCase() + key.slice(1);
              const value = (formData as any)[key];
              const errorText = errors[key];

              if (key === "action") {
                return (
                  <TextField
                    select
                    key={key}
                    name={key}
                    label="Action"
                    value={value}
                    onChange={handleChange}
                    fullWidth
                    error={!!errorText}
                    helperText={errorText}
                  >
                    {["create", "read", "update", "delete"].map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                );
              }

              if (key === "resource") {
                return (
                  <TextField
                    select
                    key={key}
                    name={key}
                    label="Resource"
                    value={value}
                    onChange={handleChange}
                    fullWidth
                    error={!!errorText}
                    helperText={errorText}
                  >
                    {[
                      "user",
                      "installation",
                      "measurement",
                      "logistic",
                      "invoice",
                    ].map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                );
              }

              return (
                <TextField
                  key={key}
                  name={key}
                  label={label}
                  value={value}
                  onChange={handleChange}
                  fullWidth
                  error={!!errorText}
                  helperText={errorText}
                />
              );
            })}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            {" "}
            {/* ✅ thay đổi ở đây */}
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Submitting..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PermissionPage;
