async function get_login_info() {
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
                    return json;
                }
            };
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

async function get_session_id() {
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
                    // return json;
                    var data = JSON.parse(json);
                    if (!data.session_id){
                        window.location.replace("/error/cannot_get_session_id.html");
                    }
                    const session_id = data.session_id;
                    console.log("session id = ");
                    console.log(session_id);
                    console.log("session end");
                    return session_id;
                }
            };
}

async function get_attachment_info(session_id) {
    var httpRequest = new XMLHttpRequest();//First: build object

            const url = `/get_attachment_info/${session_id}?`
            httpRequest.open('GET', url, true);//Second: build connect
            httpRequest.send();//Third: sand request
            /**
             * Receive data and procuess
             */
            httpRequest.onreadystatechange = function () {
                if (httpRequest.readyState == 4 && httpRequest.status == 200) {
                    var json = httpRequest.responseText;//receive json
                    let data = JSON.parse(json);
                    console.log("file info:");
                    console.log(data.file_path);
                    console.log(data.file_url);
                    console.log(data.file_state);
                    console.log("data end");
                    const file_path = data.file_path;
                    const file_url = data.file_url;
                    const file_state = data.file_state;
                    const attachment_info_data = {file_path,file_url,file_state};
                    return attachment_info_data;
                }
            };
}