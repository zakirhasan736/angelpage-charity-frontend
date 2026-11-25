/**
 * Journal posts. Also seeded into the backend (angelpage-backend: npm run seed:blog),
 * so the live site reads them from the API; this file is the fallback when the API
 * returns nothing. Generated from one source; edit both together.
 */
import { mapBlogToCard, type BlogPostRecord } from '@/lib/server-api';

export const blogPosts: BlogPostRecord[] = [
  {
    "_id": "choose-your-split-how-giving-works",
    "slug": "choose-your-split-how-giving-works",
    "title": "Choose your split: how giving works on Angelpage",
    "excerpt": "Every listing on Angelpage supports a charity, and you decide how much of the sale it receives. Here is exactly how the money moves.",
    "content": "<p class=\"lead\">On most marketplaces, the sale price goes to the seller and that is the end of it. On Angelpage, every listing is linked to a charity, and you choose how the money is shared.</p>\n<h2>The three parts of every sale</h2>\n<p>When an item sells, the price is split into three parts. A small platform fee keeps Angelpage running. What is left is shared between you and the charity you picked, in whatever proportion you set when you listed the item.</p>\n<div class=\"stat-row\">\n<div class=\"stat\"><strong>10%</strong><span>platform fee</span></div>\n<div class=\"stat\"><strong>0–100%</strong><span>your share, you choose</span></div>\n<div class=\"stat\"><strong>The rest</strong><span>goes to the charity</span></div>\n</div>\n<p>If you leave your share at zero, the charity receives everything after the fee. If you are clearing out valuable items and want to keep some of the proceeds, you can, and buyers see the split before they check out.</p>\n<aside class=\"callout\"><strong>Buyers always see the impact.</strong> Every product card shows how much of the price reaches the charity, so there is no guesswork at checkout.</aside>\n<h2>What happens after someone buys</h2>\n<ol>\n<li><strong>Payment is held safely.</strong> The buyer's payment is held until delivery is confirmed.</li>\n<li><strong>You ship the item.</strong> Add tracking from your dashboard so the buyer can follow it.</li>\n<li><strong>Funds are released.</strong> After the hold period, the charity's share moves to its pending balance and your share to yours.</li>\n<li><strong>Payout.</strong> Charities are paid out to their connected Stripe account once an admin approves the transfer.</li>\n</ol>\n<blockquote>The best part of a clear-out should be knowing exactly where the money went.</blockquote>\n<h2>Picking a split that suits you</h2>\n<p>There is no right answer. Some sellers give everything on every item. Others keep a share on higher-value pieces and give the full amount on the rest. You can set a different split on each listing.</p>\n<div class=\"takeaways\"><h3>In short</h3><ul><li>Every listing supports a charity you choose.</li><li>You set your own share, from nothing to everything after the fee.</li><li>Buyers see the charity amount on every product.</li></ul></div>",
    "coverImage": "/images/blog/blog5.jpg",
    "category": "guides",
    "authorName": "Angelpage Team",
    "publishedAt": "2026-11-20T09:00:00.000Z",
    "tags": [
      "giving",
      "selling",
      "how it works"
    ],
    "featured": true
  },
  {
    "_id": "declutter-for-good-room-by-room",
    "slug": "declutter-for-good-room-by-room",
    "title": "Declutter for good: a room-by-room guide",
    "excerpt": "A calm, practical way to clear your home, decide what to sell, and turn the things you no longer use into support for a cause.",
    "content": "<p class=\"lead\">Most homes hold more than they use. Working one room at a time keeps decluttering manageable, and listing as you go means the good stuff finds a new home instead of a cupboard.</p>\n<h2>Start with three boxes</h2>\n<p>Before you begin, set out three boxes: keep, sell and recycle. Anything you have not used in a year and would not buy again goes into one of the last two.</p>\n<h2>Room by room</h2>\n<h3>Wardrobe</h3>\n<p>Coats, knitwear and denim in good condition sell well. Check pockets, give each piece a steam, and photograph it on a hanger against a plain wall.</p>\n<h3>Kitchen and dining</h3>\n<p>Matching sets of crockery, unused gadgets and good cookware are popular. Group sets together in one listing rather than selling single plates.</p>\n<h3>Living room and bedrooms</h3>\n<p>Lamps, cushions, frames and small décor pieces are easy to post. Bulky furniture is often better listed for collection only, which you can choose when you list.</p>\n<aside class=\"callout\"><strong>Tip:</strong> list items the same day you sort them. Momentum matters, and a half-finished pile tends to drift back into the house.</aside>\n<h2>Make each listing count</h2>\n<ul>\n<li>Use natural light and a plain background.</li>\n<li>Show any wear honestly. Clear condition notes lead to happier buyers.</li>\n<li>Add the brand and size so the item appears in filtered searches.</li>\n<li>Pick a charity that means something to you. It is part of what buyers see.</li>\n</ul>\n<blockquote>A clear-out feels lighter when you know it is funding something you care about.</blockquote>\n<div class=\"takeaways\"><h3>In short</h3><ul><li>Work one room at a time with keep, sell and recycle boxes.</li><li>List items the day you sort them.</li><li>Good photos and honest condition notes sell faster.</li></ul></div>",
    "coverImage": "/images/blog/blog2.jpg",
    "category": "guides",
    "authorName": "Angelpage Team",
    "publishedAt": "2026-11-14T09:00:00.000Z",
    "tags": [
      "decluttering",
      "selling",
      "sustainability"
    ],
    "featured": false
  },
  {
    "_id": "why-small-charities-need-a-marketplace",
    "slug": "why-small-charities-need-a-marketplace",
    "title": "Why small charities need a marketplace of their own",
    "excerpt": "Small and micro charities do vital local work but rarely have the budget to sell online. A shared marketplace changes that.",
    "content": "<p class=\"lead\">Large charities have marketing teams, e-commerce sites and national campaigns. Many small charities have a handful of volunteers and a lot of goodwill. Angelpage is built to give them the same reach.</p>\n<h2>The visibility gap</h2>\n<p>Running an online shop takes time, money and technical skills that small organisations rarely have to spare. Building traffic to a standalone site is harder still. As a result, some of the most local and hands-on causes are the hardest to support online.</p>\n<h2>What a shared marketplace gives them</h2>\n<ul>\n<li><strong>A ready-made storefront.</strong> Every verified charity gets a page that lists the items sold in its name.</li>\n<li><strong>Shoppers who are already looking.</strong> Buyers browse by category and discover causes they had not heard of.</li>\n<li><strong>Support from the community.</strong> Anyone can list an item for a charity, so supporters raise funds without the charity handling stock.</li>\n</ul>\n<aside class=\"callout\"><strong>For charities:</strong> once your account is approved you can list items, follow orders and connect Stripe for payouts, all from one dashboard.</aside>\n<h2>Beyond selling</h2>\n<p>Charities can also run appeals, community polls and live sessions through Angelpage events, giving supporters more ways to get involved than a single donation button.</p>\n<blockquote>Small charities should not need a big budget to be found.</blockquote>\n<div class=\"takeaways\"><h3>In short</h3><ul><li>Small charities often lack the resources to sell online.</li><li>Angelpage gives each verified charity a storefront and an audience.</li><li>Supporters can list items on a charity's behalf.</li></ul></div>",
    "coverImage": "/images/blog/blog4.jpg",
    "category": "stories",
    "authorName": "Angelpage Team",
    "publishedAt": "2026-11-08T09:00:00.000Z",
    "tags": [
      "charities",
      "community"
    ],
    "featured": false
  },
  {
    "_id": "selling-online-guide-for-charity-shops",
    "slug": "selling-online-guide-for-charity-shops",
    "title": "Selling online: a practical guide for charity shops",
    "excerpt": "From choosing what to list to taking photos that sell, a step-by-step guide for charity shop teams and volunteers.",
    "content": "<p class=\"lead\">High-street charity shops already have the hardest part of e-commerce: great stock. Selling a selection online reaches buyers who will never walk past the window.</p>\n<h2>Choose what goes online</h2>\n<p>Not every item needs to be listed. Start with pieces that are worth the time to photograph and post: branded clothing, collectables, homeware sets and anything with a story.</p>\n<h2>Set up a simple routine</h2>\n<ol>\n<li><strong>Pick a listing day.</strong> A regular slot each week keeps the storefront fresh.</li>\n<li><strong>Create a photo corner.</strong> A plain wall near a window is all you need.</li>\n<li><strong>Batch the work.</strong> Photograph ten items, then write ten listings.</li>\n<li><strong>Ship on fixed days.</strong> Two dispatch days a week is easy to manage.</li>\n</ol>\n<h2>Photos that sell</h2>\n<div class=\"stat-row\">\n<div class=\"stat\"><strong>Light</strong><span>daylight, no flash</span></div>\n<div class=\"stat\"><strong>Background</strong><span>plain and uncluttered</span></div>\n<div class=\"stat\"><strong>Angles</strong><span>front, back, label, any wear</span></div>\n</div>\n<aside class=\"callout\"><strong>Staff and volunteers:</strong> charity accounts can invite team members with their own logins, so several people can list and manage orders.</aside>\n<h2>Keep buyers happy</h2>\n<p>Describe condition honestly, pack items carefully and add tracking as soon as an order ships. Clear communication leads to good reviews, and good reviews bring buyers back.</p>\n<div class=\"takeaways\"><h3>In short</h3><ul><li>List your best stock, not everything.</li><li>A weekly routine keeps the workload light.</li><li>Good light and honest descriptions do most of the selling.</li></ul></div>",
    "coverImage": "/images/blog/blog1.jpg",
    "category": "guides",
    "authorName": "Angelpage Team",
    "publishedAt": "2026-11-01T09:00:00.000Z",
    "tags": [
      "charity shops",
      "selling",
      "photography"
    ],
    "featured": false
  },
  {
    "_id": "appeals-polls-and-live-sessions",
    "slug": "appeals-polls-and-live-sessions",
    "title": "Appeals, polls and live sessions: getting more from events",
    "excerpt": "Angelpage events give charities three ways to engage supporters: fundraising appeals, community votes and live sessions.",
    "content": "<p class=\"lead\">Buying and selling is only one way to support a cause. Angelpage events let charities invite their community in, whether that is to give, to vote or to watch.</p>\n<h2>Three kinds of event</h2>\n<div class=\"stat-row\">\n<div class=\"stat\"><strong>Appeals</strong><span>a goal, a progress bar, quick donations</span></div>\n<div class=\"stat\"><strong>Polls</strong><span>supporters vote on what happens next</span></div>\n<div class=\"stat\"><strong>Live</strong><span>stream from the field or the office</span></div>\n</div>\n<h3>Appeals</h3>\n<p>An appeal has a clear goal and shows progress as donations arrive. Supporters choose an amount, and charities can show how funds will be allocated across different needs.</p>\n<h3>Polls</h3>\n<p>Polls let supporters have a say, for example choosing which project to fund next. Results update as votes come in.</p>\n<h3>Live sessions</h3>\n<p>Live sessions put supporters in the room. Share a stream link, set a start time and supporters can add it to their calendar or set a reminder.</p>\n<aside class=\"callout\"><strong>Tip for charities:</strong> pair a live session with an appeal. Showing the work in real time is one of the most powerful ways to explain why it needs funding.</aside>\n<h2>Sharing your event</h2>\n<p>Every event has its own page with share links for social media and messaging apps, so supporters can spread the word in a couple of taps.</p>\n<div class=\"takeaways\"><h3>In short</h3><ul><li>Appeals raise funds towards a visible goal.</li><li>Polls let supporters shape decisions.</li><li>Live sessions show the work as it happens.</li></ul></div>",
    "coverImage": "/images/blog/blog3.jpg",
    "category": "news",
    "authorName": "Angelpage Team",
    "publishedAt": "2026-10-25T09:00:00.000Z",
    "tags": [
      "events",
      "charities",
      "community"
    ],
    "featured": false
  },
  {
    "_id": "how-we-verify-charities",
    "slug": "how-we-verify-charities",
    "title": "Behind the scenes: how charities join Angelpage",
    "excerpt": "Trust is the foundation of a charity marketplace. Here is what happens before a charity's storefront goes live, and how funds stay protected.",
    "content": "<p class=\"lead\">When you buy or sell on Angelpage, you need to know the money reaches a genuine cause. That starts long before the first item is listed.</p>\n<h2>Every charity is reviewed</h2>\n<p>When a charity registers, its account is reviewed by our team before its storefront goes live. We check the details it provides, including its registration number, and only approved charities can receive funds.</p>\n<h2>Payments are protected</h2>\n<ol>\n<li><strong>Held until delivery.</strong> A buyer's payment is held until the order is confirmed as delivered.</li>\n<li><strong>Disputes are handled.</strong> If something goes wrong, buyers can open a dispute and funds stay on hold while it is resolved.</li>\n<li><strong>Approved payouts.</strong> Charity payouts go to a connected Stripe account after admin approval.</li>\n</ol>\n<aside class=\"callout\"><strong>Look for the badge.</strong> Verified charity storefronts carry a verified label, and every product shows which charity it supports.</aside>\n<h2>Reviews keep everyone accountable</h2>\n<p>Buyers and sellers can review each other after an order. Reviews help good sellers stand out and help us spot problems early.</p>\n<blockquote>Generosity works best when people can trust where it goes.</blockquote>\n<div class=\"takeaways\"><h3>In short</h3><ul><li>Charity accounts are reviewed before going live.</li><li>Payments are held until delivery is confirmed.</li><li>Verified badges and reviews build trust on both sides.</li></ul></div>",
    "coverImage": "/images/blog/blog6.jpg",
    "category": "news",
    "authorName": "Angelpage Team",
    "publishedAt": "2026-10-18T09:00:00.000Z",
    "tags": [
      "trust",
      "charities",
      "safety"
    ],
    "featured": false
  }
];

/** Card shape used by blog lists. */
export const blogData = blogPosts.map(mapBlogToCard);
