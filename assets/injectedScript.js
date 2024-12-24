console.log("Injected Script.");

(function () {
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._url = url;
    this._method = method;
    this._isTargetRequest = url.includes(
      "https://api-neo.bullx.io/v2/api/resolveTokensV2"
    );
    originalXHROpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function (body) {
    if (this._isTargetRequest) {
      try {
        const parsedBody = JSON.parse(body);
        if (
          parsedBody.name === "resolveTokensV2" &&
          parsedBody.data &&
          Array.isArray(parsedBody.data.addresses) &&
          parsedBody.data.addresses.length > 0 &&
          typeof parsedBody.data.chainId === "number"
        ) {
          

          this.addEventListener("readystatechange", function () {
            if (this.readyState === 4 && this.status === 200) {
              try {
                const response = JSON.parse(this.responseText);
                const addressKey = parsedBody.data.addresses[0];
                const links = response?.data?.[addressKey]?.links;
                const tokenData = response?.data?.[addressKey];

                if (tokenData) {
                  const { totalSupply, decimals, creationBlockNumber, symbol, deployerAddress } =
                    tokenData;

                    console.log("Token Data ", tokenData)

                  

                  // Use window.postMessage to communicate with the content script
                  window.postMessage(
                    {
                      type: "tokenDataFound",
                      totalSupply,
                      decimals,
                      creationBlockNumber,
                      symbol,
                      deployerAddress
                    },
                    "*"
                  );
                }

                if (links) {
                  const twitterLink = links.twitter || null;
                  const websiteLink = links.website || null;

                 
                  // Use window.postMessage to communicate with the content script
                  window.postMessage(
                    { type: "linksFound", twitterLink, websiteLink },
                    "*"
                  );
                } 
              } catch (error) {
                console.error("Error parsing XHR response:", error);
              }
            }
          });
        }
      } catch (error) {
        console.error("Error parsing XHR body:", error);
      }
    }

    originalXHRSend.apply(this, [body]);
  };
})();
