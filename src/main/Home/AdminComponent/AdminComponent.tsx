import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ClearIcon from "@mui/icons-material/Clear";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiAxios from "../../../api/api";
import { useDebounce } from "../../service/hooks/useDebounce";
import { useGroups } from "../../service/hooks/useGroup";
import { useUserPermissions } from "../../service/hooks/useUserPermissions";

interface User {
  id: number;
  user_name: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  password: string;
}

const activeUser = [
  {
    text: "Active",
    value: true,
  },
  {
    text: "Inactive",
    value: false,
  },
];

// const adminUser = [
//   {
//     text: "Admin",
//     value: true,
//   },
//   {
//     text: "Non Admin",
//     value: false,
//   },
// ];

const orderings = [
  {
    text: "Default",
    value: undefined,
  },
  {
    text: "From A to Z",
    value: "user_name",
  },
  {
    text: "Earliest created date",
    value: "created_at",
  },
];

function formatLabel(text: string): string {
  const formatted = text.replace(/_/g, " ");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

type UsersQueryKey = [
  string,
  {
    search?: string;
    filterActive?: boolean;
    ordering?: string;
  }
];
const fetchUsers = async ({
  pageParam = 1,
  queryKey,
}: {
  pageParam?: number;
  queryKey: UsersQueryKey;
}): Promise<any> => {
  const [_key, { search, filterActive, ordering }] = queryKey;

  const res = await apiAxios.get(
    "https://ec2api.deltatech-backend.com/api/v1/user",
    {
      params: {
        page: pageParam,
        page_size: 20,
        ...(search ? { user_name_filter: search } : {}),
        ...(filterActive !== undefined ? { is_active: filterActive } : {}),
        ...(ordering ? { ordering } : {}),
      },
    }
  );

  return res.data;
};

const AdminComponent: React.FC = () => {


  const [removedPermissionIds, setRemovedPermissionIds] = useState<number[]>(
    []
  );

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const debouncedSearch = useDebounce(search, 500);
  const [openAddPermission, setOpenAddPermission] = useState(false);
  const [idUserPermission, setIdUserPermission] = useState(0);
  const [errors, setErrors] = useState<{
    user_name?: string;
    full_name?: string;
    password?: string;
  }>({});
  // ✅ mặc định là true
  const [filterActive, setFilterActive] = useState<boolean>(true);
  // const [filterAdmin, setFilterAdmin] = useState<boolean>(true);
  const [ordering, setOrdering] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient();
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const { data: userPermissions, isLoading: isUserPermissionsLoading } =
    useUserPermissions(idUserPermission);
  const { data: dataGeroupPermission } = useGroups();

  const navigate = useNavigate();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery<
      any, // kiểu dữ liệu trả về của mỗi page
      Error, // kiểu lỗi
      any, // kiểu dữ liệu sau khi select (nếu không dùng thì giống với dòng 1)
      UsersQueryKey, // kiểu của queryKey
      number // kiểu của pageParam
    >({
      queryKey: [
        "users",
        {
          search: debouncedSearch,
          filterActive,
          ordering,
        },
      ],
      queryFn: fetchUsers,
      getNextPageParam: (lastPage) => {
        const { page, page_size, total_count } = lastPage.search_options;
        const totalPages = Math.ceil(total_count / page_size);
        return page < totalPages ? page + 1 : undefined;
      },
      initialPageParam: 1,
    });

  const observerRef = useRef<HTMLDivElement | null>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "0px",
      threshold: 1.0,
    });
    if (observerRef.current) observer.observe(observerRef.current);
    return () => {
      if (observerRef.current) observer.unobserve(observerRef.current);
    };
  }, [handleObserver]);

  const handleOpen = (user?: User) => {
    if (user) setEditUser(user);
    else
      setEditUser({
        id: 0,
        user_name: "",
        full_name: "",
        is_active: true,
        is_superuser: false,
        password: "",
      });
    setErrors({});
    setOpen(true);
  };

  const handleOpenAddPermissionForUser = (user?: User) => {
    if (user) setIdUserPermission(user.id);
    else setIdUserPermission(0);
    setOpenAddPermission(true);
  };

  const handleCloseAddPermission = () => {
    setOpenAddPermission(false);
    setIdUserPermission(0);
    setSelectedGroupIds([]);
    setRemovedPermissionIds([]);
  };

  const [loadingSaveUser, setLoadingSaveUser] = useState(false);

  const handleAddPermissionForUser = async () => {
    setLoadingSaveUser(true);

    try {
      // ✅ Lấy tất cả quyền cũ còn active
      const currentActiveIds =
        userPermissions
          ?.filter(
            (perm) => perm.is_active && !removedPermissionIds.includes(perm.id)
          )
          .map((perm) => perm.id) || [];

      // ✅ Hợp nhất quyền cũ (sau khi loại bỏ xóa) + quyền mới chọn
      const finalGroupIds = Array.from(
        new Set([...currentActiveIds, ...selectedGroupIds])
      );

      await apiAxios.post(
        `https://ec2api.deltatech-backend.com/api/v1/user/assign?user_id=${idUserPermission}`,
        finalGroupIds
      );

      toast.success("Permission updated successfully!");
      setOpenAddPermission(false);
      setLoadingSaveUser(false);
      setIdUserPermission(0);
      setSelectedGroupIds([]);
      setRemovedPermissionIds([]); // reset lại
      queryClient.invalidateQueries({ queryKey: ["userPermissions"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (error) {
      console.error("Failed to add permission:", error);
      setLoadingSaveUser(false);
      toast.error("Failed to update permissions! Please try again.");
    }
  };

  const handleSave = async () => {
    if (!editUser) return;

    const newErrors: typeof errors = {};
    if (!editUser.user_name.trim())
      newErrors.user_name = "Please enter a username";
    if (!editUser.full_name.trim())
      newErrors.full_name = "Please enter a full name";
    if (!editUser.password?.trim())
      newErrors.password = "Please enter a password";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoadingSaveUser(true);

    try {
      const queryParams = new URLSearchParams({
        user_name: editUser.user_name,
        full_name: editUser.full_name,
        is_active: editUser.is_active.toString(),
        is_superuser: editUser.is_superuser.toString(),
        password: editUser.password,
      });

      const isAddMode = editUser.id === 0;
      const url = isAddMode
        ? `https://ec2api.deltatech-backend.com/api/v1/user?${queryParams.toString()}`
        : `https://ec2api.deltatech-backend.com/api/v1/user/${
            editUser.id
          }?${queryParams.toString()}`;

      if (isAddMode) {
        await apiAxios.post(url, selectedGroupIds);
      } else {
        await apiAxios.put(url);
      }

      toast.success(
        isAddMode ? "User added successfully!" : "User updated successfully!"
      );
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditUser(null);
      setErrors({});
      setSelectedGroupIds([]);
      handleClose();
    } catch (error: any) {
      console.error("Failed to save user:", error);

      const isCreate = editUser.id === 0;

      if (error.response?.status === 400) {
        toast.error("User with this username already exists");
      } else {
        toast.error(
          isCreate ? "Failed to save user!" : "Failed to update user!"
        );
      }
    } finally {
      setLoadingSaveUser(false);
    }
  };

  /*************  ✨ Windsurf Command ⭐  *************/
  /**
   * Deletes a user with the given userId after confirmation.
   * If the user confirms the deletion, sends a request to the server to delete the user.
   * On success, displays a success toast and invalidates the "users" query cache.
   * On failure, logs the error and displays an error toast.
   *
   * @param userId - The ID of the user to be deleted.
   */

  /*******  79a4bdd8-6cce-4f10-b240-13886d514bd9  *******/
  const handleDeleteUser = async (userId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?"
    );
    if (!confirmed) return;

    try {
      await apiAxios.put(
        `https://ec2api.deltatech-backend.com/api/v1/user/delete/${userId}`
      );
      toast.success("User deleted successfully!");

      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete user!");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditUser(null);
    setErrors({});
    setSelectedGroupIds([]);
  };

  const allUsers = data?.pages.flatMap((page: any) => page?.founds) || [];

  return (
    <div className="bg-[#0d75be]">
      <div className="xl:col-span-3  p-5">
        <div className="p-4 bg-white shadow rounded-md h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Management Account</h2>
            <div className="flex gap-2">
              <Button
                variant="contained"
                color="success"
                sx={{
                  backgroundColor: "#27b771",
                  "&:hover": { backgroundColor: "#219e5c" },
                }}
                onClick={() => handleOpen()}
              >
                ➕ Add User
              </Button>
              <Button
                onClick={() => navigate("/home/admin/groupPermission")}
                variant="contained"
                color="success"
                sx={{
                  backgroundColor: "#27b771",
                  "&:hover": { backgroundColor: "#219e5c" },
                }}
              >
                Group Permissions
              </Button>
            </div>
          </div>

          {/* Search Input */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="🔍 Search by username"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          {/* Total Count */}
          <Box
            mb={2}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="body2" color="textSecondary">
              <Typography
                component="span"
                fontWeight="bold"
                color="textPrimary"
              >
                Total:
              </Typography>{" "}
              <Typography component="span" color="primary" fontWeight={500}>
                {data?.pages.reduce(
                  (acc: any, page: any) => acc + page?.founds?.length,
                  0
                )}
              </Typography>{" "}
              /{" "}
              <Typography component="span" color="textPrimary">
                {data?.pages[0]?.search_options.total_count} users
              </Typography>
            </Typography>
            {/* Sort by */}
            <Typography variant="body2" color="textSecondary" mt={1}>
              <Typography
                component="span"
                fontWeight="bold"
                color="textPrimary"
              >
                Sort by:
              </Typography>{" "}
              <select
                className="border rounded px-2 py-1 cursor-pointer"
                value={String(ordering)} // chuyển boolean sang string
                onChange={(e) => {
                  setOrdering(
                    e.target.value === "undefined" ? undefined : e.target.value
                  );
                }}
              >
                {orderings.map((item, index) => (
                  <option key={index} value={String(item.value)}>
                    {item.text}
                  </option>
                ))}
              </select>
            </Typography>
          </Box>

          {/* Table Scrollable Container */}
          <div className="overflow-y-auto flex-grow">
            <table className="w-full text-sm text-left border border-gray-200">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-3 border text-center">No.</th>
                  <th className="py-2 px-3 border text-center">User name</th>
                  <th className="py-2 px-3 border text-center">Full name</th>
                  {/* Thay th Active bằng dropdown Admin */}
                  {/* <th className="py-2 px-3 border text-center">
                    <select
                      className="border rounded px-2 py-1 cur"
                      value={String(filterAdmin)} // chuyển boolean sang string
                      onChange={(e) => {
                        setFilterAdmin(e.target.value === "true");
                      }}
                    >
                      {adminUser.map((item, index) => (
                        <option key={index} value={String(item.value)}>
                          {item.text}
                        </option>
                      ))}
                    </select>
                  </th> */}

                  {/* Thay th Active bằng dropdown */}
                  <th className="py-2 px-3 border text-center">
                    <select
                      className="border rounded px-2 py-1 cursor-pointer"
                      value={String(filterActive)} // chuyển boolean sang string
                      onChange={(e) => {
                        setFilterActive(e.target.value === "true");
                      }}
                    >
                      {activeUser.map((item, index) => (
                        <option key={index} value={String(item.value)}>
                          {item.text}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th className="py-2 px-3 border text-center max-w-[300px]">
                    Groups
                  </th>

                  <th className="py-2 px-3 border text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : allUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-4 text-center text-red-500 font-medium"
                    >
                      No results found
                    </td>
                  </tr>
                ) : (
                  allUsers.map((user: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-2 px-3 border text-center">
                        {index + 1}
                      </td>
                      <td className="py-2 px-3 border text-center">
                        {user?.user_name}
                      </td>
                      <td className="py-2 px-3 border text-center">
                        {user?.full_name}
                      </td>

                      {/* <td className="py-2 px-3 border text-center">
                        {user?.is_superuser ? "✔️" : "❌"}
                      </td> */}
                      <td className="py-2 px-3 border text-center">
                        {user?.is_active ? "✔️" : "❌"}
                      </td>
                      <td className="py-2 px-3 border text-center max-w-[600px]">
                        {user?.groups
                          ?.filter((group: any) => group.is_active === true) // ✅ chỉ lấy group active
                          .map((group: any) => {
                            const formattedName = group.name
                              .replace(/_/g, " ") // thay _ bằng dấu cách
                              .replace(/\b\w/g, (char: any) =>
                                char.toUpperCase()
                              ); // viết hoa chữ cái đầu
                            return `${group.id} - ${formattedName}`;
                          })
                          .join(", ")}
                      </td>

                      <td className="py-2 px-3 border text-center">
                        <IconButton
                          onClick={() => handleOpen(user)}
                          color="primary"
                          
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteUser(user.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>

                        <IconButton
                          onClick={() => handleOpenAddPermissionForUser(user)}
                          color="primary"
                          sx={{ color: "#22abe1" }}
                        >
                          <PersonAddIcon />
                        </IconButton>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Observer for Infinite Scroll */}
            <div ref={observerRef} className="h-10" />

            {isFetchingNextPage && (
              <div className="text-center py-4">
                <CircularProgress size={24} />
              </div>
            )}
            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
              <DialogTitle>
                {editUser?.id === 0 ? "Add User" : "Edit User"}
              </DialogTitle>
              {loadingSaveUser && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    right: 0,
                    left: 0,
                    backgroundColor: "rgba(255,255,255,0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                  }}
                >
                  <CircularProgress />
                </div>
              )}
              <DialogContent dividers>
                <TextField
                  label="User Name"
                  value={editUser?.user_name || ""}
                  onChange={(e) => {
                    setEditUser({ ...editUser!, user_name: e.target.value });
                    if (errors.user_name)
                      setErrors({ ...errors, user_name: undefined });
                  }}
                  fullWidth
                  margin="normal"
                  error={!!errors.user_name}
                  helperText={errors.user_name}
                />
                <TextField
                  label="Full Name"
                  value={editUser?.full_name || ""}
                  onChange={(e) => {
                    setEditUser({ ...editUser!, full_name: e.target.value });
                    if (errors.full_name)
                      setErrors({ ...errors, full_name: undefined });
                  }}
                  fullWidth
                  margin="normal"
                  error={!!errors.full_name}
                  helperText={errors.full_name}
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Active Status</InputLabel>
                  <Select
                    value={editUser?.is_active ? "true" : "false"}
                    onChange={(e) =>
                      setEditUser({
                        ...editUser!,
                        is_active: e.target.value === "true",
                      })
                    }
                    label="Active Status"
                  >
                    <MenuItem value="true">True</MenuItem>
                    <MenuItem value="false">False</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Super User</InputLabel>
                  <Select
                    value={editUser?.is_superuser ? "true" : "false"}
                    onChange={(e) =>
                      setEditUser({
                        ...editUser!,
                        is_superuser: e.target.value === "true",
                      })
                    }
                    label="Quyền"
                  >
                    <MenuItem value="true">True</MenuItem>
                    <MenuItem value="false">False</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Password"
                  value={editUser?.password || ""}
                  onChange={(e) => {
                    setEditUser({ ...editUser!, password: e.target.value });
                    if (errors.password)
                      setErrors({ ...errors, password: undefined });
                  }}
                  fullWidth
                  margin="normal"
                  error={!!errors.password}
                  helperText={errors.password}
                />
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={handleSave}
                  variant="contained"
                  color="primary"
                >
                  Save
                </Button>
                <Button onClick={handleClose}>Close</Button>
              </DialogActions>
            </Dialog>

            {/* add permission */}
            <Dialog
              open={openAddPermission}
              onClose={handleCloseAddPermission}
              fullWidth
              maxWidth="sm"
            >
              <DialogContent dividers>
                {/* ✅ Hiển thị các quyền hiện tại của user */}
                <Box mb={3}>
                  <DialogTitle sx={{ fontSize: 18, fontWeight: "bold", pb: 1 }}>
                    Current Groups:
                  </DialogTitle>

                  {isUserPermissionsLoading ? (
                    <Typography>Loading...</Typography>
                  ) : userPermissions?.filter((perm) => perm.is_active)
                      .length ? (
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1.5,
                        backgroundColor: "#f9f9f9",
                        border: "1px solid #ddd",
                        borderRadius: 2,
                      }}
                    >
                      {userPermissions
                        .filter(
                          (perm) =>
                            perm.is_active &&
                            !removedPermissionIds.includes(perm.id)
                        )
                        .map((perm) => (
                          <Chip
                            key={perm.id}
                            label={`${perm.id} - ${formatLabel(perm.name)}`}
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 500 }}
                            onDelete={() => {
                              setRemovedPermissionIds((prev) => [
                                ...prev,
                                perm.id,
                              ]);
                            }}
                            deleteIcon={<ClearIcon />}
                          />
                        ))}
                    </Paper>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      This user currently has no active permissions.
                    </Typography>
                  )}
                </Box>

                <DialogTitle sx={{ fontSize: 18, fontWeight: "bold", pb: 1 }}>
                  Add permission for user
                </DialogTitle>
                {/* ✅ Select để thêm group permission */}
                <FormControl fullWidth margin="normal">
                  <InputLabel id="group-select-label">Permission</InputLabel>
                  <Select
                    labelId="group-select-label"
                    multiple
                    value={selectedGroupIds}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedGroupIds(
                        typeof value === "string"
                          ? value.split(",").map(Number)
                          : value
                      );
                    }}
                    label="Chọn nhóm quyền"
                    renderValue={(selected) => {
                      const names = (selected as number[])
                        .map((id) => {
                          const group = dataGeroupPermission?.founds
                            ?.filter((g: any) => g.is_active)
                            .find((g: any) => g.id === id);
                          return group
                            ? `${group.id} - ${formatLabel(group.name)}`
                            : null;
                        })
                        .filter(Boolean)
                        .join(", ");
                      return formatLabel(names);
                    }}
                    sx={{
                      backgroundColor: "#fff",
                      borderRadius: 1,
                    }}
                  >
                    {dataGeroupPermission?.founds
                      ?.filter((group: any) => group.is_active)
                      .map((group: any) => (
                        <MenuItem
                          key={group.id}
                          value={group.id}
                          sx={{ alignItems: "flex-start" }}
                        >
                          <Box>
                            <Typography fontWeight="bold">
                              {group.id} - {formatLabel(group.name)}
                            </Typography>
                            <Box mt={0.5} pl={1}>
                              {group.permissions.length > 0 ? (
                                group.permissions.map(
                                  (p: any, index: number) => (
                                    <Typography
                                      key={p.id}
                                      variant="body2"
                                      sx={{
                                        fontSize: 13,
                                        color: "text.secondary",
                                      }}
                                    >
                                      {index + 1}. {formatLabel(p.name)}
                                    </Typography>
                                  )
                                )
                              ) : (
                                <Typography
                                  variant="body2"
                                  sx={{ fontStyle: "italic", fontSize: 13 }}
                                >
                                  No permissions
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </DialogContent>

              <DialogActions>
                <Button
                  onClick={handleAddPermissionForUser}
                  variant="contained"
                  color="primary"
                >
                  Save
                </Button>
                <Button onClick={handleCloseAddPermission}>Close</Button>
              </DialogActions>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminComponent;
