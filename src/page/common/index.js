/**
 * isArray：判断数据是不是数组类型的数据
 * author:liying
 */
export function isArray(arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
}

/**
 * isPlainObject：判断数据是不是Object类型的数据
 * author:liying
 */
export function isPlainObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]'
}

/**
 * isFunction：检查 value 是不是函数
 * author:liying
 */
export function isFunction(value) {
    return Object.prototype.toString.call(value) === '[object Function]'
}

/**
 * isLength：检查 value 是否为有效的类数组长度
 * author:liying
 */
export function isLength(value) {
    return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= Number.MAX_SAFE_INTEGER;
}

/**
 * isArrayLike：检查 value 是否是类数组
 * 如果一个值被认为是类数组，那么它不是一个函数，并且value.length是个整数，大于等于 0，小于或等于 Number.MAX_SAFE_INTEGER。这里字符串也将被当作类数组。
 * author:liying
 */
export function isArrayLike(value) {
    return value != null && isLength(value.length) && !isFunction(value);
}

/**
 * isEmpty：检查 value 是否为空
 * author:liying
 */
export function isEmpty(value) {
    // 如果是null，直接返回true
    if (value == null) {
        return true;
    }
    // 如果是类数组，判断数据长度
    if (isArrayLike(value)) {
        return !value.length;
        // 如果是Object对象，判断是否具有属性
    } else if (isPlainObject(value)) {
        for (let key in value) {
            if (hasOwnProperty.call(value, key)) {
                return false;
            }
        }
        return true;
    }
    return false;
}

/**
 * extend：将属性混合到目标对象中
 * author:liying
 */
export function extend(to, _from) {
    for (let key in _from) {
        to[key] = _from[key];
    }
    return to
}

