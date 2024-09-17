import { NextResponse } from "next/server";
import {
  getLowestPrice,
  getHighestPrice,
  getAveragePrice,
  getEmailNotifType,
} from "@/lib/utils";
import { connectToDB } from "@/lib/mongoose";
import Product from "@/lib/models/product.model";
import { scrapeAmazonProduct } from "@/lib/scraper";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";

export const maxDuration = 60; // This function can run for a maximum of 60 seconds
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Retry logic to handle 503 errors
const retryScrapeProduct = async (
  url: string,
  retries = 3,
  delay = 2000
): Promise<any | null> => {
  let attempts = 0;
  while (attempts < retries) {
    try {
      const scrapedProduct = await scrapeAmazonProduct(url);
      if (scrapedProduct) {
        return scrapedProduct;
      }
      throw new Error("Failed to scrape product");
    } catch (error: any) {
      if (attempts === retries - 1 || error.response?.status !== 503) {
        return null; // Return null if retries are exhausted or if it's a different error
      }
      attempts++;
      console.log(`Retrying (${attempts})...`);
      await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
    }
  }
  return null;
};

export async function GET(request: Request) {
  try {
    await connectToDB();

    const products = await Product.find({});

    if (!products) throw new Error("No product fetched");

    // ======================== 1 SCRAPE LATEST PRODUCT DETAILS & UPDATE DB
    const updatedProducts = await Promise.all(
      products.map(async (currentProduct) => {
        try {
          // Scrape product with retry logic
          const scrapedProduct = await retryScrapeProduct(currentProduct.url);

          // If scrape failed, skip to the next product
          if (!scrapedProduct) {
            console.warn(
              `Skipping product: ${currentProduct.url} due to scraping failure.`
            );
            return null; // Skip this product and return null
          }

          const updatedPriceHistory = [
            ...currentProduct.priceHistory,
            {
              price: scrapedProduct.currentPrice,
              date: new Date(),
            },
          ];

          const product = {
            ...scrapedProduct,
            priceHistory: updatedPriceHistory,
            lowestPrice: getLowestPrice(updatedPriceHistory),
            highestPrice: getHighestPrice(updatedPriceHistory),
            averagePrice: getAveragePrice(updatedPriceHistory),
          };

          // Update Products in DB
          const updatedProduct = await Product.findOneAndUpdate(
            { url: product.url },
            product,
            { new: true }
          );

          // ======================== 2 CHECK EACH PRODUCT'S STATUS & SEND EMAIL ACCORDINGLY
          const emailNotifType = getEmailNotifType(
            scrapedProduct,
            currentProduct
          );

          if (emailNotifType && updatedProduct.users.length > 0) {
            const productInfo = {
              title: updatedProduct.title,
              url: updatedProduct.url,
            };
            // Construct emailContent
            const emailContent = await generateEmailBody(
              productInfo,
              emailNotifType
            );
            // Get array of user emails
            const userEmails = updatedProduct.users.map(
              (user: any) => user.email
            );
            // Send email notification
            await sendEmail(emailContent, userEmails);
          }

          return updatedProduct;
        } catch (error: any) {
          console.error(
            `Failed to scrape product: ${currentProduct.url}. Error: ${error.message}`
          );
          return null; // Return null in case of failure
        }
      })
    );

    return NextResponse.json({
      message: "Ok",
      data: updatedProducts.filter(Boolean), // Filter out any null results
    });
  } catch (error: any) {
    console.error(`Failed to get all products: ${error.message}`);
    throw new Error(`Failed to get all products: ${error.message}`);
  }
}
