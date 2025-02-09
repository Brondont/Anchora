const dataUrlToFile = (dataUrl: string, filename: string): File => {
  const [header, data] = dataUrl.split(",");
  const mime = header.split(":")[1].split(";")[0];
  const binary = atob(data);
  const array = [];
  for (let i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }
  const blob = new Blob([new Uint8Array(array)], { type: mime });
  return new File([blob], filename, { type: mime });
};

export default dataUrlToFile;
