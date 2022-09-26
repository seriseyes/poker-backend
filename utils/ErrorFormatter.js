/**
 *
 * @param {string} error
 */
module.exports = (error) => {
    const errors = error.substring(error.indexOf(":") + 1).trim();
    const array = errors.split(",").map(e => e.trim());
    if (array && array.length > 0) {
        const [key, value] = array[0].split(":").map(err => err.trim());
        return value;
    }
    return null;
}