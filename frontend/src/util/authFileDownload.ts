export const authFileDownload = async (filePath: string) => {
  try {
    const token = localStorage.getItem("token");
    const apiUrl = import.meta.env.VITE_API_URL;

    const response = await fetch(`${apiUrl.split("/api/")[0]}/${filePath}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Download failed");

    const fileName = filePath.split("/")[2];

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();

    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(anchor);
  } catch (error) {}
};
