export const ethers = {
  BrowserProvider: jest.fn().mockImplementation(() => ({
    getSigner: jest.fn().mockResolvedValue({
      getAddress: jest.fn().mockResolvedValue("0x1234567890abcdef"),
    }),
    getNetwork: jest.fn().mockResolvedValue({ chainId: 11155111n }),
  })),
  Contract: jest.fn().mockImplementation(() => ({
    getNickname: jest.fn().mockResolvedValue("TestUser"),
    setNickname: jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue(true) }),
    addConfession: jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue(true) }),
    addComment: jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue(true) }),
    getAllConfessions: jest.fn().mockResolvedValue([
      { message: "Hello world", category: "Confession", timestamp: Math.floor(Date.now() / 1000) }
    ]),
    getComments: jest.fn().mockResolvedValue([])
  }))
};
