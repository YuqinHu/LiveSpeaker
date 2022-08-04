async function display_attachment() {
    var current_session_id, file_path, file_state, file_url

    var httpRequest = new XMLHttpRequest();//First: build object

    const url = `/get_current_attachment_info`
    httpRequest.open('GET', url, true);//Second: build connect
    httpRequest.send();//Third: sand request
    /**
     * Receive data and procuess
     */
    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
            var json = httpRequest.responseText;//receive json
            let data = JSON.parse(json);

            file_path = data.file_path;
            file_url = data.file_url;
            file_state = data.file_state;

            if (file_state == "EXIST"){
                document.getElementById("attachment_box").style.display="";
                document.getElementById("download_attachment").href=file_url;
            }else{
                document.getElementById("attachment_box").style.display="none";
            }
        }
    };
}

display_attachment()