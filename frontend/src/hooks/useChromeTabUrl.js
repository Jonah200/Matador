import { useEffect, useState } from "react";

function useChromeTabUrl() {
    const [url, setUrl] = useState("");

    useEffect(() => {
        if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && tabs[0].url) {
                    setUrl(tabs[0].url);
                } else {
                    setUrl("https://www.apnews.com/test-article");
                }
            });
        } else {
            console.log("Not in extension mode: Setting test URL");
            setUrl("https://www.apnews.com/mock-testing-url");
        }
    }, []);

    return url;
}

export default useChromeTabUrl;