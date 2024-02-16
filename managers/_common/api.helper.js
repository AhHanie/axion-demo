module.exports = {
  getAddedAndRemovedIds: function (oldIds, newIds) {
    if (newIds && oldIds) {
      const addedIds = newIds.filter((id) => !oldIds.includes(id));
      const removedIds = oldIds.filter((id) => !newIds.includes(id));

      return { addedIds, removedIds };
    } else if (newIds) {
      return { addedIds: newIds, removedIds: [] };
    }
    return { addedIds: [], removedIds: oldIds };
  },
  clearDuplicates: function (array) {
    if (!array || !Array.isArray(array)) {
      return array;
    }
    const newArray = [];
    for (const item of array) {
      if (!newArray.includes(item)) {
        newArray.push(item);
      }
    }
    return newArray;
  },
};
