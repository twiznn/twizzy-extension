
export async function checkSubscriptionStatus(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: "getToken" }, async (response) => {
      if (chrome.runtime.lastError || !response?.token) {
        console.error("Failed to retrieve token:", chrome.runtime.lastError);
        reject(new Error("Failed to retrieve token"));
        return;
      }

      const token = response.token;

      try {
        const apiResponse = await fetch("https://www.twizzy.dev/api/status/", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          },
          credentials: "include",
        });

        if (!apiResponse.ok) {
          throw new Error(`Error: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        resolve(data.subscribed);
      } catch (error) {
        console.error("Error fetching subscription status:", error);
        reject(error);
      }
    });
  });
}
