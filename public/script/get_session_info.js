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
                    let data = JSON.parse(json);
                    if (data.session_id){
                        window.location.replace("/error/cannot_get_session_id.html");
                    }
                    return data.session_id
                }
            };
}

async function get_attach_info(session_id) {
    var httpRequest = new XMLHttpRequest();//First: build object

            const url = `/get_login_info/session_id?`
            httpRequest.open('GET', url, true);//Second: build connect
            httpRequest.send();//Third: sand request
            /**
             * Receive data and procuess
             */
            httpRequest.onreadystatechange = function () {
                if (httpRequest.readyState == 4 && httpRequest.status == 200) {
                    var json = httpRequest.responseText;//receive json
                    let data = JSON.parse(json);
                    const file_path = data.file_path;
                    const file_url = data.file_url;
                    const file_state = data.file_state;
                    const attachment_info_data = {file_path,file_url,file_state};
                    return attachment_info_data;
                }
            };
}