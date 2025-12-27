from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from models import Property
import time


# Selenium WebDriver configuration
options = webdriver.ChromeOptions()
options.add_argument("--ignore-certificate-errors")
options.add_argument("--incognito")

service = Service(executable_path="C:/Drivers/chromedriver.exe")
driver = webdriver.Chrome(service=service, options=options)

start = False

# Function to scrape houses for sale from Daft.ie

def get_Houses_For_Sale():
    global start
    property_list = []
    urlHousesForSale = "https://www.daft.ie/property-for-sale/ireland"
    driver.get(urlHousesForSale)

    try:
        if not start:
            cookie_button = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.CLASS_NAME, "didomi-components-button"))
            )
            cookie_button.click()

            agree_button = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.ID, "btn-toggle-agree"))
            )
            agree_button.click()
            start = True

        while True:  # Keep scraping pages until there are no more pages
            listings = WebDriverWait(driver, 5).until(
                EC.presence_of_all_elements_located((By.CLASS_NAME, "sc-7e7edbc6-0"))
            )

            # Extract the details for each property listing on the current page
            for listing in listings:
                try:
                    images_url_house = []
                    details = listing.text.split("\n")

                    agency_image_element = listing.find_elements(By.TAG_NAME, "img")
                    agency_image_url = agency_image_element[0].get_attribute("src") if agency_image_element else "No Image"

                    for image in agency_image_element[1:]:
                        images_url_house.append(image.get_attribute("src"))

                    if len(details) < 8:
                        continue

                    agency_agent_name = details[0] if len(details) > 0 else "Unknown"
                    agency_name = details[1] if len(details) > 1 else "Unknown"
                    house_location = details[2] if len(details) > 2 else "Unknown"
                    house_price = details[3] if len(details) > 3 else "Unknown"
                    house_bedrooms = details[4] if len(details) > 4 else "Unknown"
                    house_bathrooms = details[5] if len(details) > 5 else "Unknown"
                    house_mt_squared = details[6] if len(details) > 6 else "Unknown"
                    house_extra_info_1 = details[7] if len(details) > 7 else "Unknown"
                    house_extra_info_2 = details[8] if len(details) > 8 else "Unknown"
                    house_extra_info_3 = details[9] if len(details) > 9 else "Unknown"
                    house_extra_info_4 = details[10] if len(details) > 10 else "Unknown"

                    # Create Property object
                    property_obj = Property(
                        agency_agent_name=agency_agent_name,
                        agency_name=agency_name,
                        house_location=house_location,
                        house_price=house_price,
                        house_bedrooms=house_bedrooms,
                        house_bathrooms=house_bathrooms,
                        house_mt_squared=house_mt_squared,
                        house_extra_info_1=house_extra_info_1,
                        house_extra_info_2=house_extra_info_2,
                        house_extra_info_3=house_extra_info_3,
                        house_extra_info_4=house_extra_info_4,
                        agency_image_url=agency_image_url,
                        images_url_house=images_url_house
                    )
                    property_list.append(property_obj)
                except Exception as e:
                    print(f"Error extracting property: {e}")
            
            # Check if the 'Next' button exists and click it to go to the next page
            try:
                next_button = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.CLASS_NAME, "sc-e8b83919-4"))
                )
                next_button.click()
                WebDriverWait(driver, 5).until(
                    EC.staleness_of(listings[0])  # Wait for the page to refresh
                )
            except Exception as e:
                print("No more pages to scrape or error:", e)
                break  # Exit the loop if there are no more pages

    except Exception as e:
        print(f"Error in the main scraping loop: {e}")
    
    return property_list


# Function to scrape all pages of houses for sale
def get_All_Houses_For_Sale():
    property_list = []
    urlHousesForSale = "https://www.daft.ie/property-for-sale/ireland"
    driver.get(urlHousesForSale)

    try:
        while True:
            properties = get_Houses_For_Sale()
            if not properties:
                break

            property_list.extend(properties)

            try:
                next_button = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.CLASS_NAME, "sc-e8b83919-4"))
                )
                next_button.click()
                time.sleep(5)
            except Exception as e:
                print("No more pages or error:", e)
                break

    except Exception as e:
        print(f"Error loading the listings or going to the next page: {e}")

    return property_list


# Main function to run the scraper
def run_scraper():
    print("Running scraper...")
    list_of_properties = get_All_Houses_For_Sale()

    # Print the properties for now, you can save them to a file or database as needed
    for property in list_of_properties:
        print(property)

# Run the scraper once
run_scraper()

# To run this script periodically, you can uncomment the following lines:
# schedule.every().day.at("08:00").do(run_scraper)
# while True:
#     schedule.run_pending()
#     time.sleep(60)
