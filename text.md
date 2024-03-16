## Сортировка слиянием на Kotlin

Сортировка слиянием - это сложный алгоритм сортировки, который обладает следующими характеристиками:

* **Эффективность:** O(n log n) время выполнения, что делает его одним из самых быстрых алгоритмов сортировки.
* **Стабильность:** Алгоритм сохраняет порядок одинаковых элементов в массиве.
* **Универсальность:** Подходит для сортировки массивов любого типа данных.

**Код:**

```kotlin
fun mergeSort(arr: IntArray): IntArray {
    if (arr.size <= 1) return arr

    val mid = arr.size / 2
    val left = arr.copyOfRange(0, mid)
    val right = arr.copyOfRange(mid, arr.size)

    return merge(mergeSort(left), mergeSort(right))
}

fun merge(left: IntArray, right: IntArray): IntArray {
    val result = IntArray(left.size + right.size)
    var i = 0
    var j = 0
    var k = 0

    while (i < left.size && j < right.size) {
        if (left[i] < right[j]) {
            result[k++] = left[i++]
        } else {
            result[k++] = right[j++]
        }
    }

    while (i < left.size) {
        result[k++] = left[i++]
    }

    while (j < right.size) {
        result[k++] = right[j++]
    }

    return result
}
```

**Объяснение:**

* `mergeSort` - рекурсивная функция, которая делит массив на две части, сортирует их 
рекурсивно, а затем объединяет отсортированные части.
* `merge` - функция, которая объединяет два отсортированных массива в один.

**Сложность:**

* **Время:** O(n log n)
* **Память:** O(n)

**Пример использования:**

```kotlin
val arr = intArrayOf(5, 2, 4, 6, 1, 3)
val sortedArr = mergeSort(arr)
println(sortedArr.joinToString()) // [1, 2, 3, 4, 5, 6]
```

**Другие сложные алгоритмы сортировки:**

* Быстрая сортировка
* Сортировка кучей
* Сортировка с помощью индексирования

**Ссылки:**

* Сортировка слиянием на Kotlin: [https://www.baeldung.com/kotlin/merge-sort](https://www.baeldung.com/kotlin/merge-sort)
* Алгоритмы сортировки на Kotlin: [неправильный URL удален]