const loader = require("./_common/fileLoader");
const Pine = require("qantra-pineapple");

/**
 * load any file that match the pattern of function file and require them
 * @return an array of the required functions
 */
module.exports = class ValidatorsLoader {
  constructor({ models, customValidators } = {}) {
    this.models = models;
    this.customValidators = customValidators;
  }
  load() {
    const validators = {};

    /**
     * load schemes
     * load models ( passed to the consturctor )
     * load custom validators
     */
    const schemes = loader("./managers/**/*.validation.js");

    Object.keys(schemes).forEach((sk) => {
      let pine = new Pine({
        models: this.models,
        customValidators: this.customValidators,
      });

      // Fix pine broken custom validators
      pine._custom = async function (vo) {
        if (this.customValidators[vo.custom]) {
          try {
            let result = await this.customValidators[vo.custom](vo.propValue);
            if (typeof result == "boolean") {
              return result;
            } else {
              /** it will return true and will overright the value */
              this.formatted[vo.path] = result;
              return true;
            }
          } catch (err) {
            console.error(
              `Error: custom validator ( ${
                vo.custom
              } )  has triggered error: ${err.toString()}`
            );
            return false;
          }
        } else {
          throw Error(`custom validator ${vo.custom} not found`);
          return false;
        }
      }.bind(pine);

      validators[sk] = {};
      Object.keys(schemes[sk]).forEach((s) => {
        validators[sk][s] = async (data) => {
          return await pine.validate(data, schemes[sk][s]);
        };
        /** also exports the trimmer function for the same */
        validators[sk][`${s}Trimmer`] = async (data) => {
          return await pine.trim(data, schemes[sk][s]);
        };
      });
    });

    return validators;
  }
};
