let isOnline = true;

export const setNetworkOnlineState = (online: boolean) => {
  isOnline = online;
};

export const getNetworkOnlineState = () => isOnline;
