declare global {
    function sleep(milliseconds: number): Promise<void>;
}

global.sleep = async (milliseconds: number): Promise<void> => {
    await new Promise((r) => setTimeout(r, milliseconds));
};
