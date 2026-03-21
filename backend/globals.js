if (typeof global.activeLectureId === "undefined") {
  global.activeLectureId = null;
  console.log("[GLOBAL] initialized activeLectureId = null");
}

if (typeof global.activeClassId === "undefined") {
  global.activeClassId = null;
  console.log("[GLOBAL] initialized activeClassId = null");
}

export {};
