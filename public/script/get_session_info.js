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