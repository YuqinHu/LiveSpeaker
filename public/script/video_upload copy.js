async function postData (vid) {
    let user = {
        session_id: vid,
    }
  
    try {
      const response = await axios.post("/UPLOADER/mark_upload", user)
      console.log("Request successful!")
    } catch (error) {
      if (error.response) {
        console.log(error.reponse.status)
      } else {
        console.log(error.message)
      }
    }
}

async function check_login() {
    var httpRequest = new XMLHttpRequest();//First: build object

            const url = "/get_login_info"
            httpRequest.open('GET', url, true);//Second: build connect
            httpRequest.send();//Third: sand request
            /**
             * Receive data and procuess
             */
            httpRequest.onreadystatechange = function () {
                if (httpRequest.readyState == 4 && httpRequest.status == 200) {
                    var json = httpRequest.responseText;//receive json
                    let data = JSON.parse(json);
                    if (!data.uid){
                        window.location.replace("/");
                    }
                }
            };
}

async function upload() {
    await check_login();

    const file = document.getElementById('selected_file').files[0];
    //display uploading state
    document.getElementById("uploading_sign").style.visibility="visible";
    var vid =  document.getElementById("vid").innerHTML;

    // Make sure a file is selected
    if (!file){
        alert("Please select a file!");
        document.getElementById("uploading_sign").style.visibility="hidden";
        return;
    };
    // Fetch the signed url
    const key = file.name;
    const response = await axios.get(`/oss/uploader/session_video/sign?key=${key}&type=${file.type}&vid=${vid}`);
    const url = response.data.url;
    try {
        // Attempt the upload
        const options = { headers: { 'Content-Type': file.type } };
        await axios.put(url, file, options);
        document.getElementById("uploading_sign").style.visibility="hidden";
        alert("Finish!");
        await postData(vid); 
        window.location.replace("/list");
    }catch(e){
        document.getElementById("uploading_sign").style.visibility="hidden";
        alert(`Upload failed: ${e}`);
    }
}