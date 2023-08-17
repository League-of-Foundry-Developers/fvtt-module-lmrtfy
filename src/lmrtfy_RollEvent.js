/**
 * lmrtfy_RollEvent: This class defines what keys are necessary to roll specific events.
 *
 * @property {boolean} shiftKey - Indicates whether the shift key was pressed. Default is false.
 * @property {boolean} altKey - Indicates whether the alt (option on Mac) key was pressed. Default is false.
 * @property {boolean} ctrlKey - Indicates whether the control key was pressed. Default is false.
 */
class lmrtfy_RollEvent {
  /**
   * @param {boolean} shiftKey - (Optional) Specifies the state of the shift key.
   * @param {boolean} altKey - (Optional) Specifies the state of the alt key.
   * @param {boolean} ctrlKey - (Optional) Specifies the state of the ctrl key.
   */
  constructor(shiftKey = false, altKey = false, ctrlKey = false, fastForward = false, advantage = false, disadvantage = false) {
    /** @type {boolean} */
    this.shiftKey = shiftKey;

    /** @type {boolean} */
    this.altKey = altKey;

    /** @type {boolean} */
    this.ctrlKey = ctrlKey;
	
	/** @type {boolean} */
	this.fastForward = fastForward;
	
	/** @type {boolean} */
	this.advantage = advantage;
	
	/** @type {boolean} */
	this.disadvantage = disadvantage;
  }
  
}
