import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { IconButton } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiAxios from "../../../../api/api";
import { useDebounce } from "../../../service/hooks/useDebounce";
import { useGroups } from "../../../service/hooks/useGroup";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description: string;
  endpoint: string;
  method: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  permissions: Permission[];
}

const API_URL = "https://ec2api.deltatech-backend.com/api/v1/permissions";

const GroupPermission = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // --- State chính ---
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [open, setOpen] = useState(false); // Create popup
  const [editOpen, setEditOpen] = useState(false); // Edit popup
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);

  // --- Form data ---
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // --- Local filters ---
  const [resource, setResource] = useState("");
  const [action, setAction] = useState("");
  const [nameInput, setNameInput] = useState("");
  const debouncedName = useDebounce(nameInput, 500);

  // --- Groups list ---
  const { data: dataGroupPermission, isLoading: isGroupsLoading } = useGroups();

  // --- Permissions query ---
  const queryUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (resource) params.append("resource", resource);
    if (action) params.append("action", action);
    if (debouncedName) params.append("name", debouncedName);
    return `${API_URL}?${params.toString()}`;
  }, [resource, action, debouncedName]);

  const { data: permissions = [], isLoading: isPermissionsLoading } = useQuery<
    Permission[]
  >({
    queryKey: ["permissions", queryUrl],
    queryFn: async () => {
      const res = await apiAxios.get(queryUrl);
      return res.data;
    },
  });

  // --- Fetch group by ID (cho popup Edit) ---
  const {
    data: dataGroupId,
    isLoading: isLoadingGroupId,
    isFetching: isFetchingGroupId,
  } = useQuery({
    queryKey: ["groupid", selectedId],
    queryFn: async () => {
      const res = await apiAxios.get(
        `https://ec2api.deltatech-backend.com/api/v1/groups/${selectedId}`
      );
      return res.data;
    },
    enabled: !!selectedId,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  // Khi có data groupId, điền vào form edit
  useEffect(() => {
    if (dataGroupId) {
      setName(dataGroupId.name || "");
      setDescription(dataGroupId.description || "");
      setSelectedPermissions(
        dataGroupId.permissions?.map((p: Permission) => p.id) || []
      );
    }
  }, [dataGroupId]);

  // --- CREATE ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = { name, description, permission_ids: selectedPermissions };
      await apiAxios.post(
        "https://ec2api.deltatech-backend.com/api/v1/groups",
        body
      );

      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("✅ Group created successfully!");
      setName("");
      setDescription("");
      setSelectedPermissions([]);
      setTimeout(() => setOpen(false), 1000);
    } catch (err: any) {
      console.error(err);

      // ✅ Kiểm tra status code
      if (err.response?.status === 400) {
        // Kiểm tra message trả về từ API
        const message = err.response?.data?.detail;

        toast.error(`❌ ${message}`);
      } else {
        toast.error("❌ Failed to create group.");
      }
    }
  };

  // --- UPDATE ---
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    try {
      const body = { name, description, permission_ids: selectedPermissions };
      await apiAxios.put(
        `https://ec2api.deltatech-backend.com/api/v1/groups/${selectedId}`,
        body
      );
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });

      toast.success("✅ Group updated successfully!");
      setEditOpen(false);
      setSelectedId(null);
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to update group.");
    }
  };

  // --- DELETE ---
  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa group này?")) return;
    try {
      await apiAxios.delete(
        `https://ec2api.deltatech-backend.com/api/v1/groups/${id}`
      );
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });

      toast.success("Group deleted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete group.");
    }
  };

  // --- Toggle permission ---
  const handlePermissionSelect = (id: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => navigate("/home/admin")}
          className="px-3 py-2 bg-[#1976d2] text-white rounded-md hover:bg-[#27b771] transition"
        >
          <ArrowBackIcon />
        </button>
        <button
          onClick={() => {
            setOpen(true);
            setName("");
            setDescription("");
            setSelectedPermissions([]);
          }}
          className="px-3 py-2 bg-[#1976d2] text-white rounded-md hover:bg-[#27b771] transition"
        >
          Create New Group
        </button>
        <button
          onClick={() => navigate("/home/admin/getListPermissions")}
          className="px-3 py-2 bg-[#1976d2] text-white rounded-md hover:bg-[#27b771] transition"
        >
          Create New Permission
        </button>
      </div>

      {isGroupsLoading ? (
        <p>Loading groups...</p>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>Active</th>
              <th style={thStyle}>Permissions</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {dataGroupPermission?.founds
              ?.filter((role: Role) => role.is_active)
              .map((role: Role, index: number) => (
                <tr key={role.id}>
                  <td style={tdStyle}>{index + 1}</td>
                  <td style={tdStyle}>{role.name}</td>
                  <td style={{ ...tdStyle, maxWidth: "300px" }}>
                    {role.description}
                  </td>

                  <td style={tdStyle}>Yes</td>
                  <td style={tdStyle}>
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {role.permissions.map((perm) => {
                        const formatText = (text: string) =>
                          text
                            .replace(/_/g, " ") // thay _ bằng dấu cách
                            .replace(/\b\w/g, (char: any) =>
                              char.toUpperCase()
                            ); // viết hoa chữ cái đầu

                        return (
                          <li key={perm.id}>
                            {formatText(perm.name)} ({formatText(perm.action)})
                          </li>
                        );
                      })}
                    </ul>
                  </td>
                  <td style={tdStyle}>
                    <IconButton
                      color="primary"
                      onClick={() => {
                        setSelectedId(role.id);
                        setEditOpen(true);
                      }}
                      aria-label="Edit"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(role.id)}
                      aria-label="Delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}

      {/* Popup Create */}
      {open && (
        <PopupForm
          title="Create New Group"
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
          name={name}
          description={description}
          setName={setName}
          setDescription={setDescription}
          selectedPermissions={selectedPermissions}
          setPermissionModalOpen={setPermissionModalOpen}
        />
      )}

      {/* Popup Edit */}
      {editOpen && (
        <PopupForm
          title={`Edit Group #${selectedId}`}
          onClose={() => {
            setEditOpen(false);
            setSelectedId(null);
          }}
          onSubmit={handleUpdate}
          name={name}
          description={description}
          setName={setName}
          setDescription={setDescription}
          selectedPermissions={selectedPermissions}
          setPermissionModalOpen={setPermissionModalOpen}
          loading={isLoadingGroupId || isFetchingGroupId}
        />
      )}

      {/* Nested Permission Modal */}
      {permissionModalOpen && (
        <div style={overlayInnerStyle}>
          <div style={{ ...modalStyle, maxWidth: 1200 }}>
            <h3>Select Permissions</h3>
            {isPermissionsLoading ? (
              <p>Loading permissions...</p>
            ) : (
              <>
                <div style={{ marginBottom: 10, display: "flex", gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Search name..."
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    style={inputStyle}
                  />
                  <select
                    value={resource}
                    onChange={(e) => setResource(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">All Resources</option>
                    <option value="user">user</option>
                    <option value="installation">installation</option>
                    <option value="measurement">measurement</option>
                    <option value="logistic">logistic</option>
                    <option value="invoice">invoice</option>
                  </select>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">All Actions</option>
                    <option value="create">create</option>
                    <option value="read">read</option>
                    <option value="update">update</option>
                    <option value="delete">delete</option>
                  </select>
                </div>

                <div
                  style={{
                    maxHeight: 400,
                    overflowY: "auto",
                    border: "1px solid #ddd",
                  }}
                >
                  {permissions.map((perm) => (
                    <div
                      key={perm.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "50px 1fr 1fr 1fr",
                        padding: "8px 12px",
                        borderBottom: "1px solid #eee",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={() => handlePermissionSelect(perm.id)}
                      />
                      <div>
                        {perm.name
                          .replace(/_/g, " ") // thay dấu gạch dưới bằng dấu cách
                          .replace(/\b\w/g, (char: any) =>
                            char.toUpperCase()
                          )}{" "}
                        {/* viết hoa chữ cái đầu mỗi từ */}
                      </div>

                      <div>{perm.resource}</div>
                      <div>{perm.action}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div
              style={{
                textAlign: "right",
                marginTop: 16,
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              {/* Nút Done */}
              <button
                onClick={() => setPermissionModalOpen(false)}
                className="px-4 py-2 bg-[#4caf50] text-white rounded-md cursor-pointer border-none hover:bg-[#43a047] transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Popup Form dùng chung cho Create & Edit ---
const PopupForm = ({
  title,
  onClose,
  onSubmit,
  name,
  description,
  setName,
  setDescription,
  selectedPermissions,
  setPermissionModalOpen,
  loading = false,
}: any) => (
  <div style={overlayStyle}>
    <div style={{ ...modalStyle, maxWidth: 600 }}>
      <div style={headerStyle}>
        <h2>{title}</h2>
        <button onClick={onClose} style={closeBtnStyle}>
          ×
        </button>
      </div>

      {loading ? (
        <p>Loading group data...</p>
      ) : (
        <form onSubmit={onSubmit}>
          <div style={formGroup}>
            <label style={labelStyle}>Group Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div style={formGroup}>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              style={{ ...inputStyle, height: 80 }}
            />
          </div>
          <div style={formGroup}>
            <label style={labelStyle}>Permissions</label>
            <button
              type="button"
              onClick={() => setPermissionModalOpen(true)}
              className="px-4 py-2 bg-[#1976d2] text-white rounded-md cursor-pointer border-none hover:bg-[#27b771] transition"
            >
              Choose Permissions
            </button>
            {selectedPermissions.length > 0 && (
              <p style={{ marginTop: 8 }}>
                Selected IDs: {selectedPermissions.join(", ")}
              </p>
            )}
          </div>

          <div style={footerStyle}>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#27b771] text-white rounded-md cursor-pointer border-none hover:bg-[#1976d2] transition"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-[#ccc] text-black rounded-md cursor-pointer border-none hover:bg-red-500 transition hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  </div>
);

// --- Styles giữ nguyên ---
const thStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "8px",
  backgroundColor: "#f2f2f2",
  textAlign: "left",
};
const tdStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "8px",
};
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};
const overlayInnerStyle = {
  ...overlayStyle,
  backgroundColor: "rgba(0,0,0,0.2)",
};
const modalStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  borderRadius: 12,
  padding: "25px 30px",
  position: "relative",
  width: "90%",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
};
const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
};
const closeBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  fontSize: 24,
  cursor: "pointer",
};
const formGroup = { marginBottom: 16 };
const labelStyle = { display: "block", marginBottom: 6, fontWeight: "bold" };
const inputStyle = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #ccc",
  width: "100%",
};
const footerStyle = { display: "flex", justifyContent: "flex-end", gap: 10 };

export default GroupPermission;
