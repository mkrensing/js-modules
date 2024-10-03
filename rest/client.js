export class RestClient {

    getJson(url, headers) {
        return new Promise((resolve, reject) => {
            let args = { method: 'GET', 
                headers: 
                   { 'Content-Type': 'application/json', ...(headers || {}) }
               };            
            fetch(url).then(response => {
                if (!response.ok) {
                    throw new Error('client.get failed for url ' + url + '. response: ' + response.text);
                }
                return response.json(); 
            })
            .then(data => {
                resolve(data);
            })
            .catch(error => {
                reject(error);
            });
        })
    }

    postJson(url, body, headers) {
        return new Promise((resolve, reject) => {
            let args = { method: 'POST', 
                         headers: 
                            { 'Content-Type': 'application/json', ...(headers || {}) },
                         body: JSON.stringify(body || {})
                        };
            fetch(url, args).then(response => {
                if (!response.ok) {
                    throw new Error('client.get failed for url ' + url + '. response: ' + response.text);
                }
                return response.json(); 
            })
            .then(data => {
                resolve(data);
            })
            .catch(error => {
                reject(error);
            });
        })
    }

    
}