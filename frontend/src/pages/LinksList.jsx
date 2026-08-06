import React, { useEffect } from "react";
import { useSnackbar } from 'notistack';
import { useDispatch, useSelector } from "react-redux";
import { fetchLinks, deleteLink } from "@/store/linksSlice";

function LinksList() {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.links);

  useEffect(() => {
    dispatch(fetchLinks());
  }, [dispatch]);

  if (loading) return <p>Loading links…</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  if (items.length === 0) {
    return <p>No public links yet.</p>;
  }

  const copyLink = (link) => {
    navigator.clipboard.writeText(link.link).then(() => {
      enqueueSnackbar("Link copied!", {variant: 'success'});
    });
  };

  const cellStyle = {
    border: "1px solid #ccc",
    padding: "8px",
    verticalAlign: "top",
  };
  const btnStyle = {
    padding: "6px 12px",
    cursor: "pointer",
    background: "#e0e0e0",
    border: "none",
    borderRadius: "4px",
  };

  return (
    <div sx={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
      <h2>Public Links</h2>
      <table sx={{ width: "100%", borderCollapse: "collapse", marginTop: "16px" }}>
        <thead>
          <tr>
            <th sx={cellStyle}>File</th>
            <th sx={cellStyle}>Expires</th>
            <th sx={cellStyle}>Downloads</th>
            <th sx={{ ...cellStyle, textAlign: "center" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((link) => (
            <tr key={link.id}>
              <td sx={cellStyle}>
                <strong>{link.file_info.original_name}</strong>
                <br />
                <small>ID: {link.file_info.id}</small>
              </td>
              <td sx={cellStyle}>
                {link.expires_at
                  ? new Date(link.expires_at).toLocaleString()
                  : "Never"}
              </td>
              <td sx={cellStyle}>{link.download_count}</td>
              <td sx={{ ...cellStyle, textAlign: "center" }}>
                <button
                  onClick={() => copyLink(link)}
                  sx={btnStyle}
                >
                  Copy Link
                </button>
                {" | "}
                <button
                  onClick={() => dispatch(deleteLink(link.id))}
                  sx={{ ...btnStyle, background: "#ffcccc", color: "#a00" }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LinksList;