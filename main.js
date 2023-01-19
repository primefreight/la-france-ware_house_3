// This is the main Node.js source code file of your actor.
// It is referenced from the "scripts" section of the package.json file,
// so that it can be started by running "npm start".

// Import Apify SDK. For more information, see https://sdk.apify.com/
const Apify = require("apify");
const moment = require("moment");

Apify.main(async () => {
  // Get input of the actor (here only for demonstration purposes).
  // If you'd like to have your input checked and have Apify display
  // a user interface for it, add INPUT_SCHEMA.json file to your actor.
  // For more information, see https://apify.com/docs/actor/input-schema
  const { ccns } = await Apify.getInput();

  //local testing
  // const ccns = ["81351067614"];


  console.log("Launching Puppeteer...");
  const browser = await Apify.launchPuppeteer();

  const page = await browser.newPage();
  for (let ccn of ccns) {
      try {
    await page.goto("https://www.lafrance.qc.ca/lcms/view/login.do");
    await page.waitForSelector(
      '.attributes .edition-container input[name*=":cargo-lookup-form:"].textInput'
    );

    const elements = await page.$$(
      '.attributes .edition-container input[name*=":cargo-lookup-form:"].textInput'
    );

    await elements[0].click({ clickCount: 3 });
    await elements[0].type(ccn);
    await page.click('input[value="Cargo Status"]');
    await page.waitForSelector(".cargo-attributes-panel td.label-container");
    let result = await page.evaluate(async () => {
      const result = {};
     let array_data= document.querySelectorAll(".cargo-attributes-panel td.label-container")
        try{
            array_data.forEach((el) => {
                console.log(el)
                if (el.innerText === "Cargo Control Number") {
                    result.tracking_id = el.nextElementSibling.innerText;
                } else if (
                    el.innerText === "Container Status"
                ) {
                    result.Container_status = el.nextElementSibling.innerText;
                }else if (el.innerText === "Arrival Date") {
                    result.Arrival_date = el.nextElementSibling.innerText;
                } else if (el.innerText === "Storage Date") {
                    result.Storage_date = el.nextElementSibling.innerText;
                } else if (
                    el.innerText === "Delivery Status"
                ) {
                    result.Delivery_status = el.nextElementSibling.innerText;
                } else if (el.innerText === "Shipped Time") {
                    result.Shipped_time = el.nextElementSibling.innerText;
                } else if (
                    el.innerText === "Delivery Appointment"
                ) {
                    result.Delivery_appointment = el.nextElementSibling.innerText;
                    result.Delivery_appointment = new Date(result.Delivery_appointment.slice(0, 10) + ' ' + result.Delivery_appointment.slice(20)).toISOString();
                } else if (el.innerText === "Delivery Time") {
                    result.Delivery_date = el.nextElementSibling.innerText;
                } else if (el.innerText === "Custom Release") {
                    result.Customs_date = el.nextElementSibling.innerText;
                }
            })
        }catch {
            console.log("Iterator problem")
        }



      return result;
    }
    result = {
        ...result,
        Delivery_appointment: (result.Delivery_appointment && result.Delivery_appointment.length > 0) ? moment(result.Delivery_appointment).format('YYYY-MM-DD hh:mm:ss') : '',
        Shipped_time: (result.Shipped_time && result.Shipped_time.length > 0) ? moment(result.Shipped_time).format('YYYY-MM-DD hh:mm:ss') : '',
        Delivery_date: (result.Delivery_date && result.Delivery_date.length > 0) ? moment(result.Delivery_date).format('YYYY-MM-DD hh:mm:ss') : '',
    }
    console.log(result);
    await Apify.pushData(result);
      } catch(e) {
          console.log("not found", ccn);
      }
}


console.log("Closing Puppeteer...");
await browser.close();
    const dataset = await Apify.openDataset();
    const results = await dataset.getData().then(res => res.items);
    await Apify.setValue('OUTPUT', results);
  console.log("Done.");
});
