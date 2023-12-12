const generateColorHexadecimal = () => {
    let colorHex = '#'

    for (let i = 0; i < 3; i++) {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F']
        const r = parseInt(Math.random() * 7)
        const parR = [parseInt(Math.random() * 9), letters[r] || parseInt(Math.random() * 9)]
        const factorR = parseInt(Math.random() * 2)
        if (factorR) {
            colorHex += parR.reverse().join('')
        } else {
            colorHex += parR.join('')
        }
    }
    return colorHex
}

export default generateColorHexadecimal