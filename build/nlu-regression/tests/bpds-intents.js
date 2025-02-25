const problemMaker = (bitfan) => async (name, trainSet, testSet) => {

  const fileDef = {
    lang: "en",
    fileType: "dataset",
    type: "intent",
    namespace: "bpds"
  }

  const trainFileDef = { name: trainSet, ...fileDef }
  const testFileDef = { name: testSet, ...fileDef }

  return {
    name,
    type: "intent",
    trainSet: await bitfan.datasets.readDataset(trainFileDef),
    testSet: await bitfan.datasets.readDataset(testFileDef),
    lang: "en",
  };
};


module.exports = function(bitfan) {

  const metrics = [
    bitfan.metrics.accuracy,
    bitfan.metrics.oosAccuracy,
    bitfan.metrics.oosPrecision,
    bitfan.metrics.oosRecall,
    bitfan.metrics.oosF1,
  ];

  return {
    name: "bpds-intent",

    computePerformance: async function() {
        
      const makeProblem = problemMaker(bitfan)
      const problems = [
        await makeProblem("bpsd A", "A-train", "A-test"),
        await makeProblem("bpds A imbalanced", "A-imbalanced-train", "A-test"),
        await makeProblem("bpds A fewshot", "A-fewshot-train", "A-test"),
        await makeProblem("bpds B", "B-train", "B-test"),
      ];
  
      const stanEndpoint = "http://localhost:3200";
      const password = "123456";
      const engine = bitfan.engines.makeBpIntentEngine(stanEndpoint, password);
  
      const solution = {
        name: "bpds intent",
        problems,
        engine
      };
  
      const seeds = [42, 69, 666];
      const results = await bitfan.runSolution(solution, seeds);
  
      const performanceReport = bitfan.evaluateMetrics(results, metrics);
  
      await bitfan.visualisation.showPerformanceReport(performanceReport, { groupBy: "seed" });
      await bitfan.visualisation.showPerformanceReport(performanceReport, { groupBy: "problem" });
      await bitfan.visualisation.showOOSConfusion(results);
  
      return performanceReport
    },

    evaluatePerformance: function(currentPerformance, previousPerformance) {
      const toleranceByMetric = {
        [bitfan.metrics.accuracy.name]: 0.02,
        [bitfan.metrics.oosAccuracy.name]: 0.05,
        [bitfan.metrics.oosPrecision.name]: 0.05,
        [bitfan.metrics.oosRecall.name]: 0.05,
        [bitfan.metrics.oosF1.name]: 0.15, // more tolerance for f1 score
      }
      return bitfan.comparePerformances(currentPerformance, previousPerformance, { toleranceByMetric })
    }
  }
}
