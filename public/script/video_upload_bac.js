async function upload() {
    const file = document.getElementById('selected_file').files[0];
    //display uploading state
    document.getElementById("uploading_sign").style.visibility="visible";

    // Make sure a file is selected
    if (!file) return;
    // Fetch the signed url
    const key = file.name;
    const response = await axios.get(`/oss/uploader/session_video/sign?key=${key}&type=${file.type}`);
    const url = response.data.url;
    try {
        // Attempt the upload
        const options = { headers: { 'Content-Type': file.type } };
        await axios.put(url, file, options);
    }catch(e){
        alert(`Upload failed: ${e}`);
    }
}