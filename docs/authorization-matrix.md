# VieRates Authorization Matrix

This is the repo-owned launch matrix used by `tests/security/authz.matrix.test.ts`.
Server code must derive the actor role and lender organization from Clerk and
database records, never from client-supplied request bodies.

| Actor                | Resource       | Action                                  | Ownership / Condition                                                     | Decision |
| -------------------- | -------------- | --------------------------------------- | ------------------------------------------------------------------------- | -------- |
| Unauthenticated      | Any            | Any                                     | No verified server actor                                                  | Deny     |
| Borrower             | Listing        | Read                                    | `listing.borrowerUserId === actor.userId`                                 | Allow    |
| Borrower             | Listing        | Update                                  | `listing.borrowerUserId === actor.userId`                                 | Allow    |
| Borrower             | Listing        | Read/update                             | Other borrower listing                                                    | Deny     |
| Borrower             | Masked listing | Read                                    | Lender board projection                                                   | Deny     |
| Borrower             | Identity       | Read                                    | Own identity                                                              | Allow    |
| Borrower             | Admin          | Manage state rules, approvals, disputes | Any                                                                       | Deny     |
| Lender LO            | Listing        | Masked read                             | Approved org, GREEN state, coverage box matches state/purpose/loan amount | Allow    |
| Lender LO            | Listing        | Masked read                             | No coverage match or non-GREEN state                                      | Deny     |
| Lender LO            | Identity       | Read                                    | No identity grant                                                         | Deny     |
| Lender LO            | Identity       | Read                                    | Identity grant exists for actor org                                       | Allow    |
| Lender LO            | Identity       | Read                                    | Identity grant belongs to another org                                     | Deny     |
| Lender LO            | Wallet         | Read                                    | Same lender org                                                           | Allow    |
| Lender LO            | Billing        | Manage                                  | Same lender org                                                           | Deny     |
| Lender org admin     | Wallet         | Read                                    | Same lender org                                                           | Allow    |
| Lender org admin     | Billing        | Manage                                  | Same lender org                                                           | Allow    |
| Lender user          | Wallet/billing | Read/manage                             | Other lender org                                                          | Deny     |
| Pending lender org   | Board          | Read                                    | Org status is not APPROVED                                                | Deny     |
| Suspended lender org | Board/bid      | Read/create                             | Org status is not APPROVED                                                | Deny     |
| Admin                | Admin          | Manage state rules, approvals, disputes | Server-derived admin role                                                 | Allow    |
